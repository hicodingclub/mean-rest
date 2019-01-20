const meanRestExpressRouter = require('../lib/rest_router')
const util = require('../util')

const addPasswordHandlers = require('./password_handler');
const AuthnController = require('./authn_controller')

const AuthnRouter = function(sysDef, authConfig) {
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
  
  let expressRouter = meanRestExpressRouter(sysDef, authConfig);

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
