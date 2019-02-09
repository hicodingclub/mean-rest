const meanRestExpressRouter = require('mean-rest-express')
const addPasswordHandlers = require('./authn/password_handler');

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
  return meanRestExpressRouter.RestRouter(authUserDef, authAppConfig);
}
//used to manage the user authorizations
module.exports.GetDefaultAuthzRouter = function(authAppConfig) {
  return meanRestExpressRouter.RestRouter(authzDef, authAppConfig);
}
