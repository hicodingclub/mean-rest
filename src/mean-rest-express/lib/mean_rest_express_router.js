var express = require('express');

var RestController = require('./mean_rest_express_controller')

function RestRouter(name) {
	var router = express.Router();

	router.get('/', RestController.getAll);
	let idParam = name + "Id";
	router.get('/:' + idParam, RestController.getDetailsById);
	router.put('/', RestController.Create);
	router.post('/:' + idParam, RestController.Update);
	router.delete('/:' + idParam, RestController.HardDeleteById);

	router.post('/', RestController.PostActions);
	return router;
}

module.exports = RestRouter
