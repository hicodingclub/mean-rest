const mongoose = require('mongoose');
const express = require('express');
const createError = require('http-errors');

const util = require('../util')
const RestController = require('./rest_controller')
const RestRouter = require('./rest_sub_router')


const processField = function(x) {
  let hidden = false;
  let field = x;
  let matches = x.match(/\((.*?)\)/);
  if (matches) {
    hidden = true;
    field = matches[1];
  }
  return [field, hidden];
}

var processViewStr = function(viewStr) {
  if (!viewStr) return viewStr;
  //1. remove virtical bar |, and split to array
  let fields = viewStr.replace(/\|/g, ' ').match(/\S+/g)
  //2. process each field
  fields = fields.map(x=>{
    let [f, hidden] = processField(x);
    return f;
  })
  //3. join to string
  viewStr = fields.join(" ");
  
  return viewStr;
}

const _setModuleName = function(name) {
  return function(req, res, next) {
    req.mddsModuleName = name;
    next();
  }
}

const meanRestExpressRouter = function(sysDef, moduleName, authConfig) {
  let expressRouter = express.Router();
  if (!moduleName) moduleName = randomString(10);
  
  let setModuleName = _setModuleName(moduleName)
  expressRouter.use(setModuleName);
  
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
  let schemas = sysDef.schemas;

  let sub_routes = [];
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    
    let name = schemaName.toLowerCase();
    let api;
    if ("api" in schemas[schemaName]) {
      api = schemas[schemaName].api
    } else {
      api = "LCRUD";
    }

    let schm = schemaDef.schema;
    let model;
    if (schm) {
      schm.set('toObject', {getters: false, virtuals: true});
      schm.set('toJSON', {getters: false, virtuals: true});
      model = mongoose.model(schemaName, schm );//model uses given name
    }
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    let views = [];
    let schemaViews = schemaDef.views;
    if (schemaViews) {
      for (let view of schemaDef.views) {
        view = processViewStr(view);
        //console.log("====view", view);
        views.push(view);
      }
    }
    //pass pure view string to register.
    if (schm) {
      RestController.register(schemaName, schemaDef.schema, views, model, moduleName);
    }
    if (permissionStore && api) {
      permissionStore.registerResource(schemaName, moduleName);
    }
  }
  
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    let name = schemaName.toLowerCase();
    let api;
    if ("api" in schemas[schemaName]) {
      api = schemas[schemaName].api
    } else {
      api = "LCRUD";
    }

    if (!api) continue;
    sub_routes.push("/" + name);
    
    if (!schemaDef.schema) continue
    restRouter = RestRouter(schemaName, authzFunc, api);
    expressRouter.use("/" + name, restRouter)
  }
  
  expressRouter.get("/", (req, res, next) => {
    res.send(sub_routes);
  });
  expressRouter.mdds = {
    sub_routes: sub_routes,
    authzFunc: authzFunc
  }
  expressRouter.sub_routes = sub_routes;
  
  //not supported api
  expressRouter.use(function(req, res, next) {
    next(createError(404));
  });
  
  //error handler
  expressRouter.use(function(err, req, res, next) {     
    let e = {"error": err.message,
      "status": err.status || 500};
    if (req.app.get('env') === 'development') {
        e.details = err.stack
      }
     
      // render the error page
    res.status(err.status || 500);
    res.json(e);
  });

  return expressRouter;
}

const _setSchemaName = function(name) {
  return function(req, res, next) {
    req.meanRestSchemaName = name;
    next();
  }
}

meanRestExpressRouter.Hook = function(expressRouter, subRouterName, subRouter) {
  const routPath = "/" + subRouterName
  if (!expressRouter.mdds || !expressRouter.mdds.sub_routes.includes(routPath)) {
    console.warn("Hook subrouter failed. Not predefined in system definition: " + subRouterName);
    return expressRouter;
  }
  setSchemaName = _setSchemaName(subRouterName);
  subRouter.use(setSchemaName); 
  let num = 1;
  if (expressRouter.mdds && expressRouter.mdds.authzFunc) {
    subRouter.use(expressRouter.mdds.authzFunc);
    num++;
  }
  subRouter = util.moveRouterStackTailToHead(subRouter, num) //move forward to head

  expressRouter.use(routPath, subRouter)
  expressRouter = util.moveRouterStackTailForward(expressRouter, 3) //move forward before error handling
  
  return expressRouter;
}

module.exports = meanRestExpressRouter;
