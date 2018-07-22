var createError = require('http-errors');

var views_collection = {}; //views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
var model_collection = {};

var loadContextVars = function(url) {
	let arr = url.split('/');
	if (arr.length < 2) throw(createError(500, "Cannot identify context name from routing path: " + url))
	let name = arr[arr.length-2].toLowerCase();
	let model = model_collection[name];
	let views = views_collection[name];
	if (!model || !views) throw(createError(500, "Cannot load context from routing path " + url))
	return {name: name, model: model, views: views};
}

var RestController = function() {
}

RestController.register = function(name, views, model) {
	views_collection[name.toLowerCase()] = views;
	model_collection[name.toLowerCase()] = model;
};
	
RestController.getAll = function(req, res, next) {
	let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);
	//views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
	let schema = views[0], briefView = views[1];
	
	let query = {};
	//get the query parameters ?a=b&c=d, but filter out unknown ones
	//TODO: support the nested objects
	for (var prop in req.query) {
		if (prop in schema.paths) {
			query[prop] = req.query[prop];
		}
	}
	
	model.find(query, briefView, function (err, result) {
		if (err) { return next(err); }
		res.send(result);
	});
};
	
RestController.getDetailsById = function(req, res, next) {
	let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);
	//views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
	let detailView = views[2];

	let idParam = name + "Id";
	let id = req.params[idParam];
	model.findById(id, detailView, function (err, result) {
		if (err) { return next(err); }
		res.send(result);
	});
};
	
RestController.HardDeleteById = function(req, res, next) {
	let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);
	
	let idParam = name + "Id";
	let id = req.params[idParam];
	model.findByIdAndDelete(id).exec(function (err, result) {
		if (err) { return next(err); }
		res.send();
	});
};

RestController.Create = function(req, res, next) {
	let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);
	
	let body = req.body;
	if (typeof body === "string") {
	    try {
	        body = JSON.parse(body);
	    } catch(e) {
	    	next(createError(404, "Bad " + name + " document."));
	    }
	}

	model.create(body, function (err, result) {
		if (err) { return next(err); }
		res.send(result);
	});	
};

module.exports = RestController;