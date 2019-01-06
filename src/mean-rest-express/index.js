var authUserDef = require('./authn/user.model')
var RestController = require('./lib/mean_rest_express_controller')
var meanRestExpressRouter = require('./lib/mean_rest_express_router')


module.exports.RestRouter = meanRestExpressRouter;
module.exports.authRouter = meanRestExpressRouter(authUserDef);
