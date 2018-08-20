var mongoose = require('mongoose');
var express = require('express');
var RestController = require('./lib/mean_rest_express_controller')
var RestRouter = require('./lib/mean_rest_express_router')

function meanRestExpressRouter(sysDef) {
	let expressRouter = express.Router();
	let schemas = sysDef.schemas;

	let sub_routes = [];
	for (let schemaName in schemas) {
		var schemaDef = schemas[schemaName];
		//schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
		name = schemaName.toLowerCase();
		var model = mongoose.model(schemaName, schemaDef.schema, );//model uses given name
		
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
