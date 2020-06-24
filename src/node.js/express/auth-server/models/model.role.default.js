const authAccountDef = require('./model.account');
const GetAuthzModuleDef = require('./model.role');

let accScmName = authAccountDef.authn.authUserSchema;
const authzDef = GetAuthzModuleDef(accScmName, authAccountDef.schemas[accScmName]);

module.exports = authzDef;