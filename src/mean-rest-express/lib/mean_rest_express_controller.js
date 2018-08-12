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
	
	const PER_PAGE = 25, MAX_PER_PAGE = 1000;
	
	let __page = 1;
	let __per_page = PER_PAGE;
	
	for (var prop in req.query) {
		if (prop === "__page") __page = parseInt(req.query[prop]);
		else if (prop === "__per_page") __per_page = parseInt(req.query[prop]);
		else if (prop in schema.paths) {
			query[prop] = req.query[prop];
		}
	}
	
	let count = 0;
	
    model.countDocuments({}).exec(function(err, cnt) {
        if (err) { return next(err); }
        count = cnt;
        
    	if (isNaN(__per_page) || __per_page <= 0) __per_page = PER_PAGE;
    	else if (__per_page > MAX_PER_PAGE) __per_page = MAX_PER_PAGE;

    	let maxPageNum = Math.ceil(count/(__per_page*1.0));

    	if (isNaN(__page)) __page = 1;
    	if (__page > maxPageNum) __page = maxPageNum;
    	if (__page <= 0) __page = 1;
    	
    	let skipCount = (__page - 1) * __per_page;
    	
    	model.find({}, briefView)
            .skip(skipCount)
            .limit(__per_page)
            .exec(function(err, result) {
                if (err) return next(err)
                let output = {
                	total_count: count,
                	total_pages: maxPageNum,
                	page: __page,
                	per_page: __per_page,
                	items: result
                }
                res.send(output);
            })        
    })
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

RestController.PostActions = function(req, res, next) {	
	let action = "";
	for (var prop in req.query) {
		if (prop === "action") action = req.query[prop];
	}
	
	let body = req.body;
	if (typeof body === "string") {
	    try {
	        body = JSON.parse(body);
	    } catch(e) {
	    	next(createError(404, "Bad " + name + " document."));
	    }
	}

	switch(action) {
    case "DeleteManyByIds":
    	let ids = body;
        RestController.deleteManyByIds(req, res, next, ids);
        break;
    default:
    	next(createError(404, "Bad Action: " + action));
	}
}

RestController.deleteManyByIds = function(req, res, next, ids) {
	let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);

	model.deleteMany({"_id": {$in: ids}})
		.exec(function (err, result) {
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

RestController.Update = function(req, res, next) {
        let {name: name, model: model, views: views} = loadContextVars(req.originalUrl);

        let body = req.body;
        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch(e) {
                next(createError(404, "Bad " + name + " document."));
            }
        }

    	let idParam = name + "Id";
    	let id = req.params[idParam];
    	model.replaceOne({_id: id}, body, function (err, result) {
                if (err) { return next(err); }
                res.send();
        });
};


module.exports = RestController;
