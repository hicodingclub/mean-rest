var mongoose = require('mongoose');
var express = require('express');
var RestController = require('./lib/mean_rest_express_controller')
var RestRouter = require('./lib/mean_rest_express_router')

function meanRestExpressRouter(schemas) {
	var expressRouter = express.Router();

	var sub_routes = [];
	for (var name in schemas) {
		var views = schemas[name];
		//views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
		name = name.toLowerCase();
		var model = mongoose.model(name, views[0], );
		
		RestController.register(name, views, model);
		
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
