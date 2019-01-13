const meanRestExpressRouter = require('../lib/rest_router')
const util = require('../util')

const addPasswordHandlers = require('./password_handler');
const AuthnController = require('./authn_controller')

const AuthnRouter = function(sysDef) {  
  let authUserFields = "username";
  if ("authUserFields" in sysDef.config) {
    authUserFields = sysDef.config["authUserFields"];
  }
  let authPasswordField = "password";
  if ("authPasswordField" in sysDef.config) {
    authPasswordField = sysDef.config["authPasswordField"];
  }
  let authSchemaName;
  if ("authUserSchema" in sysDef.config) {
    authSchemaName = sysDef.config["authUserSchema"];
    AuthnController.registerAuth(authSchemaName, authUserFields, authPasswordField);
  }

  let schemas = sysDef.schemas;
  for (let schemaName in schemas) {
    let schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence

    if (schemaName == authSchemaName) {
      let schm = schemaDef.schema;
      schemaDef.schema = addPasswordHandlers(schm, authPasswordField);
      break;
    }
  }
  
  let expressRouter = meanRestExpressRouter(sysDef);

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
    expressRouter = util.moveRouterStackTailToHead(expressRouter, 3);
  }

  return expressRouter;
}

module.exports = AuthnRouter;
