const meanRestExpressRouter = require('./lib/rest_router')
const restController = require('./lib/rest_controller')

//function. input is schema definition of the module, return a express router.
module.exports.RestRouter = meanRestExpressRouter;

//An object. Expose the ModelExecute() function.
module.exports.restController = restController;