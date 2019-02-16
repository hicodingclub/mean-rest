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
  return meanRestExpress.RestRouter(authUserDef, authAppConfig, "Users");
}
//used to manage the user authorizations
module.exports.GetDefaultAuthzRouter = function(authAppConfig) {
  const authzRouter =  meanRestExpress.RestRouter(authzDef, authAppConfig, "Roles");
  
  function modelExecuteCallback(taskStr) {
    function callBack(err, result) {
      if (err) {
        console.warn(" --- model excecute failed: ", taskStr, err.errmsg);
      } else {
        console.log(" --- model excecute succeeded: ", taskStr);
      }
    }
    return callBack;
  }
  
  //admin user
  restController.ModelExecute(
          "muser",
          "create",
          modelExecuteCallback("create admin user with initial password 'adminPassword'..."),
          {username: 'admin', password: 'adminPassword'} //document
      );
  
  //admin role
  restController.ModelExecute(
          "mrole",
          "create",
          modelExecuteCallback("create admin role..."),
          {role: 'admin', description: 'Administrator roles with full permissions.'} //document
      );
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    restController.ModelExecute(
            "mmodule",
            "update",
            modelExecuteCallback("insert modules " + m + " with resources: " + modules[m]),
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        );
  }
  return authzRouter;
}


