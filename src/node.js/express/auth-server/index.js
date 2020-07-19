const meanRestExpress = require('@hicoder/express-core')
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
const GetAuthzModuleDefAdmin = require('./authz/model.role');
let accScmName = authAccountDef.authn.authUserSchema;
const authzAdminDef = GetAuthzModuleDefAdmin(accScmName, authAccountDef.schemas[accScmName]);
//authorization  - User Roles based authorization
const GetAuthzModuleDefUser = require('./models/model.user-role');
let userScmName = authUserDef.authn.authUserSchema;
const authzUserDef = GetAuthzModuleDefUser(userScmName, authUserDef.schemas[userScmName]);

//authorization  - Public Access based authorization, used to manage the public access
const accessDef = require('./authz/model.access');

const AuthzController = require('./authz/controller');
//authentication router
module.exports.GetDefaultAuthnRouter = function(authDef, options) {
  let getRoleFunc;

  if (options && options.authz === 'role') {
    let authzSchemaDef;
    if (options.authzModel === 'user') {
      authzSchemaDef = authzUserDef;
    } else {
      authzSchemaDef = authzAdminDef;
    }
    // need a restController instance that the role table can be accessed.
    const internalRoleRouter =  meanRestExpress.RestRouter(authzSchemaDef, 'internal-role-manager');
    const restController = internalRoleRouter.restController;
    // the function to get account roles that can be used as middleware in Authn router.
    getRoleFunc = AuthzController.getAccountRoles(restController); // function that appends user roles in user info
  }
  return GetAuthnRouter(authDef, options, getRoleFunc,);
}

const dbOperations = require('./defaultDbOperations');

//used to manage the admin user authorizations
module.exports.GetDefaultRolesManageRouter =  function(moduleName, authAppFuncs) {
  const authzRouter =  meanRestExpress.RestRouter(authzAdminDef, moduleName, authAppFuncs);
  const restController = authzRouter.restController;
  dbOperations.populateRoles(restController, 'admin');
  return authzRouter;
}

//used to manage the user role authorizations
module.exports.GetDefaultUserRolesManageRouter =  function(moduleName, authAppFuncs) {
  const authzRouter =  meanRestExpress.RestRouter(authzUserDef, moduleName, authAppFuncs);
  const restController = authzRouter.restController;
  dbOperations.populateRoles(restController, 'user');
  return authzRouter;
}

//used to manage the public access
module.exports.GetDefaultAccessManageRouter =  function(moduleName, authAppFuncs) {
  const accessRouter =  meanRestExpress.RestRouter(accessDef, moduleName, authAppFuncs);
  const restController = accessRouter.restController;
  dbOperations.populatePublicAccess(restController);
  return accessRouter;
}
