var meanRestExpressRouter = require('./lib/rest_router')

var AuthRouter = require('./authn/authn_router')
var authUserDef = require('./authn/user.model')


module.exports.RestRouter = meanRestExpressRouter;
module.exports.AuthRouter = AuthRouter;
module.exports.authRouter = AuthRouter(authUserDef);