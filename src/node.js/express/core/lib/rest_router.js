const mongoose = require('mongoose');
const express = require('express');
const createError = require('http-errors');

const { processViewStr } = require('./view-str');

const {
  moveRouterStackTailToHead,
  moveRouterStackTailForward,
  archiveDocument,
} = require('../util');
const RestController = require('./rest_controller');
const RestRouter = require('./rest_sub_router');

const PredefinedPatchFields = {
  muser_id: { type: String, index: true },
  mmodule_name: { type: String, index: true },
};

const _setModuleName = function (name) {
  return function (req, res, next) {
    req.mddsModuleName = name;
    return next();
  };
};

const registerSchemas = function (
  schemas,
  restController,
  db_app_name,
  db_module_name,
  moduleName,
  patch,
  owner,
  permissionStore
) {
  for (let schemaName in schemas) {
    const schemaDef = schemas[schemaName];

    let name = schemaName.toLowerCase();
    let api;
    if ('api' in schemas[schemaName]) {
      api = schemas[schemaName].api;
    } else {
      api = 'LCRUDA';
    }

    const tags = schemaDef.tags;
    const schm = schemaDef.schema;
    const mraBE = schemaDef.mraBE || {};
    let collectionName = mraBE.collection;
    let model;
    if (schm) {
      // apply archive
      schm.plugin(archiveDocument);

      const patchFields = schemaDef.patch || patch || [];
      for (const p of patchFields) {
        if (p in PredefinedPatchFields) {
          const f = {};
          f[p] = PredefinedPatchFields[p];
          schm.add(f);
        } else {
          console.warn(
            'Warning: ignore patching. Field is not a predefined patch fields:',
            p
          );
        }
      }
      schm.set('toObject', { getters: false, virtuals: true });
      schm.set('toJSON', { getters: false, virtuals: true });

      if (collectionName) {
        model = mongoose.model(schemaName, schm, collectionName); //model uses given name and given collection
      } else {
        collectionName = '';
        if (db_app_name) {
          collectionName += `${db_app_name}_`;
        }
        if (db_module_name) {
          collectionName += `${db_module_name}_`;
        }
        collectionName += name;
        model = mongoose.model(schemaName, schm, collectionName); //model uses given name
      }
    }
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    const views = [];
    const schemaViews = schemaDef.views;
    if (schemaViews) {
      for (let view of schemaDef.views) {
        view = processViewStr(view);
        //console.log("====view", view);
        views.push(view);
      }
    }
    //pass pure view string to register.
    if (schm) {
      // apply owner
      const ownerConfig = schemaDef.owner || owner;

      // tell controller to use save so mongoose logic of plugin can be triggered
      schm.options.useSaveInsteadOfUpdate = true; //this is a special indicator to controller use save.
      restController.register(
        schemaName,
        schm,
        views,
        model,
        moduleName,
        ownerConfig,
        mraBE,
        tags
      );
    }
    if (permissionStore && api) {
      permissionStore.registerResource(schemaName, moduleName);
    }
  }
};

const meanRestExpressRouter = function (sysDef, moduleName, authConfig) {
  const expressRouter = express.Router();
  const restController = new RestController();
  expressRouter.restController = restController;

  if (!moduleName) moduleName = randomString(10);

  const DB_CONFIG = sysDef.DB_CONFIG;
  let db_app_name, db_module_name;
  if (DB_CONFIG) {
    db_app_name = DB_CONFIG.APP_NAME;
    db_module_name = DB_CONFIG.MODULE_NAME;
  }
  if (!db_app_name || !db_module_name) {
    throw new Error(
      `APP Name and Module Name not provided for database. Please provide "DB_CONFIG" for your schema definition in module ${moduleName}.`
    );
  }
  db_app_name = db_app_name.toLowerCase();
  db_module_name = db_module_name.toLowerCase();

  const setModuleName = _setModuleName(moduleName);
  expressRouter.use(setModuleName);

  let patch = []; //extra fields patching to the schema
  // schema level patch and owner
  if (sysDef.config && sysDef.config.patch) {
    patch = sysDef.config.patch;
  }
  let owner = { enable: false, type: 'user' };
  if (sysDef.config && sysDef.config.owner) {
    owner = sysDef.config.owner;
  }

  let authzFunc;
  let permissionStore;
  if (authConfig) {
    let authnFunc = authConfig.authnFunc;
    if (authnFunc) expressRouter.use(authnFunc);

    authzFunc = authConfig.authzFunc;
    permissionStore = authConfig.permissionStore;

    if (!sysDef.authz) sysDef.authz = {};
    permissionStore.registerAuthz(moduleName, sysDef.authz);

    let setModuleAuthz = authConfig.setPermissionFunc;
    expressRouter.use(setModuleAuthz);
  }

  //console.log("*******sysDef", sysDef)
  let schemas = sysDef.schemas || {};
  expressRouter.schemas = schemas;
  registerSchemas(
    schemas,
    restController,
    db_app_name,
    db_module_name,
    moduleName,
    patch,
    owner,
    permissionStore
  );

  // register BE only schemas,
  const schemasBE = sysDef.schemasBE || {};
  for (let schemaName in schemasBE) {
    const schemaDef = schemasBE[schemaName][0]; // first element
    const collectionName = schemasBE[schemaName][1]; // second element
    // set mraBE collection
    if (schemaDef.mraBE) {
      schemaDef.mraBE.collection = collectionName;
    } else {
      schemaDef.mraBE = {
        collection: collectionName,
      };
    }
    schemasBE[schemaName] = schemaDef;
  }
  // undefined - don't use patch, owner and not set permission in permissionStore
  registerSchemas(
    schemasBE,
    restController,
    db_app_name,
    db_module_name,
    moduleName,
    undefined,
    undefined,
    undefined
  );

  let sub_routes = [];
  for (let schemaName in schemas) {
    const schemaDef = schemas[schemaName];
    const name = schemaName.toLowerCase();
    let api;
    if ('api' in schemas[schemaName]) {
      api = schemas[schemaName].api;
    } else {
      api = 'LCRUDA';
    }
    const mraBE = schemaDef.mraBE || {};
    const filters = mraBE.filters || {};
    const zInterfaces = mraBE.zInterfaces || {};

    if (!api) continue;
    sub_routes.push('/' + name);

    if (!schemaDef.schema) continue;
    restRouter = RestRouter(
      restController,
      schemaName,
      authzFunc,
      api,
      filters,
      zInterfaces
    );
    expressRouter.use('/' + name, restRouter);
  }

  expressRouter.get('/', (req, res, next) => {
    res.send(sub_routes);
  });
  expressRouter.mdds = {
    sub_routes: sub_routes,
    authzFunc: authzFunc,
  };
  expressRouter.sub_routes = sub_routes;

  //not supported api
  expressRouter.use(function (req, res, next) {
    next(createError(404));
  });

  //error handler
  expressRouter.use(function (err, req, res, next) {
    const e = { error: err.message, status: err.status || 500 };
    if (req.app.get('env') === 'development') {
      e.details = err.stack;
    }

    // render the error page
    res.status(err.status || 500);
    return res.json(e);
  });

  expressRouter.setEmailer = function (emailer, info) {
    if (!restController.mddsProperties) {
      restController.mddsProperties = {};
    }
    // no predefined template at this time.
    // emailer.populateTemplatesToDB(templates);
    let schemas = expressRouter.schemas;
    for (let schemaName in schemas) {
      const schemaDef = schemas[schemaName];
      const mraBE = schemaDef.mraBE || {};
      const emailerConf = mraBE.emailer || {};
      const templates = emailerConf.templates || [];
      const replacement = emailerConf.replacement || {};
      const hooks = emailerConf.hooks || {};
      if (templates.length > 0) {
        emailer.populateTemplatesToDB(templates);
      }
    }

    restController.mddsProperties.emailer = emailer;

    // no predefined object at this time.
    restController.mddsProperties.emailerObj = {};

    if (info) {
      restController.mddsProperties.emailerObj = info;
    }
  };

  return expressRouter;
};

const _setSchemaName = function (name) {
  return function (req, res, next) {
    req.meanRestSchemaName = name;
    return next();
  };
};

meanRestExpressRouter.Hook = function (
  expressRouter,
  subRouterName,
  subRouter
) {
  const routPath = '/' + subRouterName;
  if (
    !expressRouter.mdds ||
    !expressRouter.mdds.sub_routes.includes(routPath)
  ) {
    console.warn(
      'Hook subrouter failed. Not predefined in system definition: ' +
        subRouterName
    );
    return expressRouter;
  }
  setSchemaName = _setSchemaName(subRouterName);
  subRouter.use(setSchemaName);
  let num = 1;
  if (expressRouter.mdds && expressRouter.mdds.authzFunc) {
    subRouter.use(expressRouter.mdds.authzFunc);
    num++;
  }
  subRouter = moveRouterStackTailToHead(subRouter, num); //move forward to head

  expressRouter.use(routPath, subRouter);
  expressRouter = moveRouterStackTailForward(expressRouter, 3); //move forward before error handling

  return expressRouter;
};

module.exports = meanRestExpressRouter;
