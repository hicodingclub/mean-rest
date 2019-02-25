const meanRestExpress = require('mean-rest-express')
const addPasswordHandlers = require('./authn/password_handler');

const restController = meanRestExpress.restController;

//authentication
const GetAuthnRouter = require('./authn/router')  //a function, input is the schema definition, return router
const authUserDef = require('./authn/model') //default auth user schema definition

//add password handler for the default auth user schema
let {authUserSchema, authPasswordField} = authUserDef.authn;
authUserDef.schemas[authUserSchema].schema = addPasswordHandlers(authUserDef.schemas[authUserSchema].schema, authPasswordField);

//authorization
const GetAuthzDef = require('./authz/model')  //a function, input is the user schema, return authz sys def.
const authzDef = GetAuthzDef(authUserSchema, authUserDef.schemas[authUserSchema]); //default authz sys def, with default auth user schema

//authentication
module.exports.GetAuthnRouter = GetAuthnRouter;
module.exports.GetDefaultAuthnRouter = function() {
  return GetAuthnRouter(authUserDef);
}
//used to manage the user profiles
module.exports.GetDefaultUserRouter = function(authAppConfig) {
  return meanRestExpress.RestRouter(authUserDef, 'Users', authAppConfig);
}
//used to manage the user authorizations
module.exports.GetDefaultAuthzRouter =  function(authAppConfig) {
  const authzRouter =  meanRestExpress.RestRouter(authzDef, 'Roles', authAppConfig);
  
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
    takInfo = 'create "admin" user with initial password "adminPassword"...';
    await restController.ModelExecute(
            "muser",
            "create",
            {username: 'admin', password: 'adminPassword'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    let adminUserId;
    takInfo = 'get "admin" user information...';
    await restController.ModelExecute(
            "muser",
            "findOne",
            {username: "admin"}//search criteria
        ).then(function(result) {
            if (result) adminUserId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    if (adminRoleId && adminUserId) {
      takInfo = 'insert "admin" user with "Administrator" role...';
      restController.ModelExecute(
              "muserrole",
              "create",
              {user: adminUserId, role: [adminRoleId] } //document
          ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    }    

    
    //Other user roles:
    //1. "Anyone" user role
    //2. "LoginUserOwn" user role
    //3. "LoginUserOthers" user role    
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
        
  }
  
  runDB();
  //admin role
  return authzRouter;
}


