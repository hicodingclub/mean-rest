const express = require('express');
const createError = require('http-errors');

const AuthnController = require('./controller')

const AuthnRouter = function(userDef, getUserRoleFunc) {
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

  let schemas = userDef.schemas;
  for (let schemaName in schemas) {
    let schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence

    if (schemaName == authSchemaName) {
      let schm = schemaDef.schema;
      AuthnController.registerAuth(authSchemaName, schemaDef.schema, 
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
      AuthnController.authLogin,
      roleFunc,
      AuthnController.generateToken
    );

    expressRouter.post(
      "/refresh",
      setSchemaName,
      AuthnController.verifyRefreshToken,
      AuthnController.authRefresh,
      roleFunc,
      AuthnController.generateToken
    );

    expressRouter.post("/register",
      setSchemaName,
      AuthnController.authRegister
    );

    expressRouter.post("/changepass",
      setSchemaName,
      AuthnController.authLogin,
      AuthnController.changePass
    );

    expressRouter.post("/findpass",
      setSchemaName,
      AuthnController.findPass
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

  return expressRouter;
}

module.exports = AuthnRouter;
