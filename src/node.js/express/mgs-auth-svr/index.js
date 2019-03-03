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

const restController = meanRestExpress.restController;

//authentication
const GetAuthnRouter = require('./authn/router')  //a function, input is the schema definition, return router
const authUserDef = require('./authn/model.user') //default auth user schema definition
const authAccountDef = require('./authn/model.account');
addPasswordHandlersToDef(authUserDef);
addPasswordHandlersToDef(authAccountDef);

module.exports.authUserDef = authUserDef;
module.exports.authAccountDef = authAccountDef;

//authorization
const GetAuthzDef = require('./authz/model.role');
let accScmName = authAccountDef.authn.authUserSchema;
const authzDef = GetAuthzDef(accScmName, authAccountDef.schemas[accScmName]);

const AuthzController = require('./authz/controller');
let getAccountRoles = AuthzController.getAccountRoles

module.exports.authzDef = authzDef;

//authentication
module.exports.GetDefaultAuthnRouter = function(authDef, withRoles) {
  if (withRoles) return GetAuthnRouter(authDef, getAccountRoles);
  return GetAuthnRouter(authDef);
}

//used to manage the user authorizations
module.exports.GetDefaultAuthzRouter =  function(authAppFuncs) {
  const authzRouter =  meanRestExpress.RestRouter(authzDef, 'Roles', authAppFuncs);
  
  function modelExecuteSuccess(taskStr) {
    function doSomething(result) {
      console.log(" --- auth server: model excecute succeeded: ", taskStr);
    }
    return doSomething;
  }
  function modelExecuteError(taskStr) {
    function doSomething(err) {
      if (err.code === 11000) console.log(" --- auth server: model excecute already exist: ", taskStr);
      else if (err.errmsg) console.warn(" --- auth server: model excecute failed: ", taskStr, err.errmsg);
      else console.warn(" --- auth server: model excecute failed: ", taskStr, err.message);
    }
    return doSomething;
  }
  
  async function runDB() {
    let taskInfo;
    
    //pre-configured data:
    //admin user:
    //1. "Administrator" user role
    //2. "All Modules" system module
    //3. "Administrator" role permission to "All Modules"
    //4. "admin" user
    //5. "admin" user with "Administrator" role.
    
    takInfo = 'create "Administrator" role with full permissions...';
    await restController.ModelExecute(
            "mrole",
            "create",
            {role: 'Administrator', description: 'Administrator roles with full permissions.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));

    takInfo = 'insert system modules "All Modules" ...';
    await restController.ModelExecute(
            "mmodule",
            "create",
            {module: "All Modules", resources: "All resources in the system."} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    
    takInfo = 'get "Administrator" role infomation...';
    let adminRoleId;
    await restController.ModelExecute(
            "mrole",
            "findOne",
            {role: 'Administrator'}//search criteria
        ).then(function(result) {
            if (result) adminRoleId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    takInfo = 'get "All Modules" module infomation...';
    let allModuleId;
    await restController.ModelExecute(
            "mmodule",
            "findOne",
            {module: "All Modules"}//search criteria
        ).then(function(result) {
            if (result) allModuleId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    if (adminRoleId && allModuleId) {
      takInfo = 'insert permission for "Administrator" role for "All Modules"...';
      restController.ModelExecute(
              "mpermission",
              "create",
              //{role: adminRoleId, module: allModuleId}, //search criteria
              {role: adminRoleId, module: allModuleId, modulePermission: "CRUD"}//document
          ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    }    
    takInfo = 'create "admin" account with initial password "adminPassword"...';
    await restController.ModelExecute(
            "maccount",
            "create",
            {username: 'admin', password: 'adminPassword'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    let adminUserId;
    takInfo = 'get "admin" account information...';
    await restController.ModelExecute(
            "maccount",
            "findOne",
            {username: "admin"}//search criteria
        ).then(function(result) {
            if (result) adminUserId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    if (adminRoleId && adminUserId) {
      takInfo = 'insert "admin" account with "Administrator" role...';
      restController.ModelExecute(
              "maccountrole",
              "create",
              {account: adminUserId, role: [adminRoleId] } //document
          ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    }    

    
    //Other user roles:
    //1. "Anyone" user role
    //2. "LoginUserOwn" user role
    //3. "LoginUserOthers" user role    
    /*
    takInfo = 'create "Anyone" role ...';
    await restController.ModelExecute(
            "mrole",
            "create",
            {role: 'Anyone', description: 'Any one, login or not.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    takInfo = 'create "LoginUserOwn" role ...';
    await restController.ModelExecute(
            "mrole",
            "create",
            {role: 'LoginUserOwn', description: 'Any login user, when trying to manage its own resource'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    takInfo = 'create "LoginUserOthers" role ...';
    await restController.ModelExecute(
            "mrole",
            "create",
            {role: 'LoginUserOthers', description: 'Any login user, when trying to manage other user\'s resource'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    */
  }
  
  runDB();
  //admin role
  return authzRouter;
}


