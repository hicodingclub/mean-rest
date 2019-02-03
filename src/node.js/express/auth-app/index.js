const verifyToken = require('./lib/authn')
const verifyPermissionFuncCreator = require('./lib/authz')

const authConfig = {
  "authnFunc": verifyToken,
  "authzFuncCreator": verifyPermissionFuncCreator
}

module.exports = authConfig;
