var authUserDef = require('./auth/user.model')
var RestController = require('./lib/mean_rest_express_controller')
var meanRestExpressRouter = require('./lib/mean_rest_express_router')


module.exports.RestRouter = meanRestExpressRouter;
module.exports.RestController = RestController;
module.exports.authRouter = meanRestExpressRouter(authUserDef);
