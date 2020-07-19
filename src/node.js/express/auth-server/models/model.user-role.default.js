// The default authz definition for role based access on "muser" model
const authUserDef = require('../authn/model.user');
const GetAuthzModuleDef = require('./model.user-role');

let accScmName = authUserDef.authn.authUserSchema;
const authzDef = GetAuthzModuleDef(accScmName, authUserDef.schemas[accScmName]);

module.exports = authzDef;
