const express = require('express');
const createError = require('http-errors');

const AuthnController = require('./controller')
const { templates, commonInfo } = require('./mdds-emailing');

const AuthnRouter = function(userDef, options, getUserRoleFunc) {
  let authModelCreated = false; 
  const authn = userDef.authn || {};
  let authUserFields = "username";
  if ("authUserFields" in authn) {
    authUserFields = authn["authUserFields"];
  }
  let authPasswordField = "password";
  if ("authPasswordField" in authn) {
    authPasswordField = authn["authPasswordField"];
  }
  let authSchemaName;
  if ("authUserSchema" in authn) {
    authSchemaName = authn["authUserSchema"];
  }

  const authnController = new AuthnController(options);

  let schemas = userDef.schemas;
  for (let schemaName in schemas) {
    let schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence

    if (schemaName == authSchemaName) {
      let schm = schemaDef.schema;
      authnController.registerAuth(authSchemaName, schemaDef.schema, 
              authUserFields, authPasswordField);
      authModelCreated = true;
      break;
    }
  }
  
  let expressRouter = express.Router();
  let setSchemaName = function(req, res, next) {
    req.authSchemaName = authSchemaName;
    next();
  }
  
  let roleFunc = function(req, res, next) {
    if (getUserRoleFunc) getUserRoleFunc(req, res, next);
    else next();
  }

  if (authModelCreated) {
    expressRouter.post(
      "/login", 
      setSchemaName,
      authnController.authLogin.bind(authnController),
      roleFunc,
      authnController.generateToken.bind(authnController)
    );

    expressRouter.post(
      "/refresh",
      setSchemaName,
      authnController.verifyRefreshToken.bind(authnController),
      authnController.authRefresh.bind(authnController),
      roleFunc,
      authnController.generateToken.bind(authnController)
    );

    expressRouter.post("/register",
      setSchemaName,
      authnController.authRegister.bind(authnController)
    );

    expressRouter.post("/regverification",
      setSchemaName,
      authnController.authVerifyReg.bind(authnController)
    );

    expressRouter.post("/changepass",
      setSchemaName,
      authnController.authLogin.bind(authnController),
      authnController.changePass.bind(authnController)
    );

    expressRouter.post("/findpass",
      setSchemaName,
      authnController.findPass.bind(authnController)
    );

    //expressRouter = util.moveRouterStackTailToHead(expressRouter, 3);
    
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

  }

  expressRouter.setEmailer = function(emailer, info) {
    if (!authnController.mddsProperties) {
      authnController.mddsProperties = {};
    }
    emailer.populateTemplatesToDB(templates);

    authnController.mddsProperties.emailer = emailer;
    authnController.mddsProperties.emailerObj = commonInfo;

    if (info) {
      authnController.mddsProperties.emailerObj = info;
    }
  }

  return expressRouter;
}

module.exports = AuthnRouter;
