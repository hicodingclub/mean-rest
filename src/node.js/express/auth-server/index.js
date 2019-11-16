const meanRestExpress = require('mean-rest-express')
const addPasswordHandlers = require('./authn/password_handler');
const addPasswordHandlersToDef = function(authDef) {
  let authUserSchema, authPasswordField;
  if (!authDef.authn ) {
    throw Error("addPasswordHandlersToDef: authn not defined for the schema.");
  }
  authUserSchema = authDef.authn.authUserSchema;
  authPasswordField = authDef.authn.authPasswordField;

  //add password handler for the default auth account schema
  authDef.schemas[authUserSchema].schema = addPasswordHandlers(authDef.schemas[authUserSchema].schema, authPasswordField);
}

//authentication
const GetAuthnRouter = require('./authn/router')  //a function, input is the schema definition, return router
const authUserDef = require('./authn/model.user') //default auth user schema definition
const authAccountDef = require('./authn/model.account');
addPasswordHandlersToDef(authUserDef);
addPasswordHandlersToDef(authAccountDef);

module.exports.authUserDef = authUserDef;
module.exports.authAccountDef = authAccountDef;

//authorization  - Admin Roles based authorization
const GetAuthzModuleDef = require('./authz/model.role');
let accScmName = authAccountDef.authn.authUserSchema;
const authzDef = GetAuthzModuleDef(accScmName, authAccountDef.schemas[accScmName]);

// need a restController instance that the role table can be accessed.
const internalRoleRouter =  meanRestExpress.RestRouter(authzDef, 'internal-role-manager');
const restController = internalRoleRouter.restController;
//getAccountRoles - the function to get account roles that can be used as middleware in Authn router.
const AuthzController = require('./authz/controller');
let getAccountRoles = AuthzController.getAccountRoles(restController)

//authorization  - Public Access based authorization, used to manage the public access
const accessDef = require('./authz/model.access');

module.exports.authzDef = authzDef;

//authentication router
module.exports.GetDefaultAuthnRouter = function(authDef, withRoles) {
  if (withRoles) return GetAuthnRouter(authDef, getAccountRoles); //append user roles in user info
  return GetAuthnRouter(authDef);
}

const dbOperations = require('./defaultDbOperations');

//used to manage the admin user authorizations
module.exports.GetDefaultRolesManageRouter =  function(moduleName, authAppFuncs) {
  const authzRouter =  meanRestExpress.RestRouter(authzDef, moduleName, authAppFuncs);
  const restController = authzRouter.restController;
  dbOperations.populateAdminRoles(restController);
  return authzRouter;
}

//used to manage the public access
module.exports.GetDefaultAccessManageRouter =  function(moduleName, authAppFuncs) {
  const accessRouter =  meanRestExpress.RestRouter(accessDef, moduleName, authAppFuncs);
  const restController = accessRouter.restController;
  dbOperations.populatePublicAccess(restController);
  return accessRouter;
}
