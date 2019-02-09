const express = require('express');

const AuthnController = require('./controller')

const AuthnRouter = function(sysDef) {
  const authn = sysDef.authn || {};
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

  let schemas = sysDef.schemas;
  for (let schemaName in schemas) {
    let schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence

    if (schemaName == authSchemaName) {
      let schm = schemaDef.schema;
      AuthnController.registerAuth(authSchemaName, schemaDef.schema, authUserFields, authPasswordField);
      break;
    }
  }
  
  //let expressRouter = meanRestExpressRouter(sysDef);
  let expressRouter = express.Router();

  if (!!authSchemaName) {
    expressRouter.post(
      "/login", 
      (req, res, next) => {
        AuthnController.authLogin(req, res, next);
      },
      (req, res, next) => {
        AuthnController.generateToken(req, res, next);
      }
    );

    expressRouter.post(
      "/refresh", 
      (req, res, next) => {
        AuthnController.verifyRefreshToken(req, res, next);
      },
      (req, res, next) => {
        AuthnController.authRefresh(req, res, next);
      },
      (req, res, next) => {
        AuthnController.generateToken(req, res, next);
      }
    );

    expressRouter.post("/register", (req, res, next) => {
      AuthnController.authRegister(req, res, next);
    });
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
