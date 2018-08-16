var mongoose = require('mongoose');
var express = require('express');
var RestController = require('./lib/mean_rest_express_controller')
var RestRouter = require('./lib/mean_rest_express_router')

function meanRestExpressRouter(schemas) {
	let expressRouter = express.Router();

	let sub_routes = [];
	for (let name in schemas) {
		var schemaDef = schemas[name];
		//schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
		name = name.toLowerCase();
		var model = mongoose.model(name, schemaDef.schema, );
		
		RestController.register(name, schemaDef.schema, schemaDef.views, model);
		
		restRouter = RestRouter(name);
		expressRouter.use("/" + name, restRouter)
		sub_routes.push(name + "/");
	}
	
	expressRouter.get("/", (req, res, next) => {
		res.send(sub_routes);
	});
	return expressRouter;
}

module.exports.RestRouter = meanRestExpressRouter;
