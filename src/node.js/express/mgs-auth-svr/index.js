const meanRestExpressRouter = require('mean-rest-express')

//authentication
const GetAuthnRouter = require('./authn/router')  //a function, input is the schema definition, return router
const authUserDef = require('./authn/model') //default auth user schema definition
//authorization
const GetAuthzDef = require('./authz/model')  //a function, input is the user schema, return authz sys def.
const authzDef = GetAuthzDef('muser', authUserDef.schemas['muser']); //default authz sys def, with default auth user schema

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
