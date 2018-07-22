var express = require('express');
var RestController = require('./mean_rest_express_controller')

function RestRouter(name) {
	var router = express.Router();

	router.get('/', RestController.getAll);
	let idParam = name + "Id";
	router.get('/:' + idParam, RestController.getDetailsById);
	router.delete('/:' + idParam, RestController.HardDeleteById);
	router.put('/', RestController.Create);
	
	return router;
}

module.exports = RestRouter