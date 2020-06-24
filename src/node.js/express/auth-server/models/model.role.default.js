const authAccountDef = require('../authn/model.account');
const GetAuthzModuleDef = require('../authz/model.role');

let accScmName = authAccountDef.authn.authUserSchema;
const authzDef = GetAuthzModuleDef(accScmName, authAccountDef.schemas[accScmName]);

module.exports = authzDef;
