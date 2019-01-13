const createError = require('http-errors');

const schema_collection = {};
const views_collection = {}; //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
const model_collection = {};
const populate_collection = {};

const auth = {};

const loadContextVarsByName = function(name) {
  let schema = schema_collection[name];
  let model = model_collection[name];
  let views = views_collection[name];
  let populates = populate_collection[name];
  if (!schema || !model || !views || !populates) throw(createError(500, "Cannot load context from name " + name))
  return {name: name, schema: schema, model: model, views: views, populates: populates};
}

const loadContextVars = function(req) {
  //let url = req.originalUrl
  //let arr = url.split('/');
  //if (arr.length < 2) throw(createError(500, "Cannot identify context name from routing path: " + url))
  //let name = arr[arr.length-2].toLowerCase();

  let name = req.meanRestRouteName;
  return loadContextVarsByName(name);
}

const createRegex = function(obj) {
  //obj in {key: string} format
  for (let prop in obj) {
    let userInput = obj[prop];
    obj[prop] = new RegExp(
      // Escape all special characters except *
      userInput.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1")
          .replace(/\*/g, ".*"), // Allow the use of * as a wildcard like % in SQL.
      'i');
  }
  return obj;
}

const checkAndSetValue = function(obj, schema) {
  //obj in {item: value} format
  for (let item in obj) {
    if (item in schema.paths) {
      let type = schema.paths[item].constructor.name;
      if (type == 'SchemaDate') {
        if (typeof obj[item] == 'string') { //exact data provided:
          let dt = new Date(obj[item]);
          let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
          let d1 = new Date(y, m, d);
          let d2 = new Date(y, m, d);
          
          d2.setDate(d2.getDate() + 1);
                   
          obj[item] = {"$gte": d1,"$lt": d2};
        } else if (typeof obj[item] == 'object') { //data range
          let o = {};
          if (obj[item]['from']) {
            let dt = new Date(obj[item]['from']);
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d1 = new Date(y, m, d);
            o["$gte"] = dt;
          }
          if (obj[item]['to']) {
          let dt = new Date(obj[item]['to']);
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d2 = new Date(y, m, d);
            //d2.setDate(d2.getDate() + 1);
          
            o["$lt"] = dt;
          }
          obj[item] = o;
        }
      } else if (type == 'SchemaString') {
        let userInput = obj[item];

        obj[item] = new RegExp(
          // Escape all special characters 
          userInput.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"),
          'i');
      }
    }
  }
  return obj;
}

const getViewPopulates = function(schema, viewStr) {
	
	let populates = [];
	let viewFields = viewStr.match(/\S+/g) || [];
	viewFields.forEach((item) => {
		if (item in schema.paths) {
			let type = schema.paths[item].constructor.name;
			switch (type) {
				case "ObjectId":
					let ref = schema.paths[item].options.ref;
					if (ref)
						populates.push([item, ref]);
					break;
				default:
					;
			}
		}
	});
	return populates;
}

const getPopulatesRefFields = function(ref) {
	let views = views_collection[ref.toLowerCase()]; //view registered with lowerCase
	if (!views) return null;
	//views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
	return views[5]; //indexView
}


let RestController = function() {
}
RestController.loadContextVarsByName = loadContextVarsByName;

RestController.register = function(name, schema, views, model) {
	schema_collection[name.toLowerCase()] = schema;
	views_collection[name.toLowerCase()] = views;
	model_collection[name.toLowerCase()] = model;

	//views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format	
	populate_collection[name.toLowerCase()] = {
			//populates in a array, each populate is an array, too, with [field, ref]
			//eg: [["person", "Person"], ["comments", "Comments"]]
			briefView: getViewPopulates(schema, views[0]),
			detailView: getViewPopulates(schema, views[1])
	}
};

RestController.getAll = function(req, res, next) {
	return RestController.searchAll(req, res, next, {});
}

RestController.searchAll = function(req, res, next, searchContext) {
  let {name: name, schema: schema, model: model, views: views, populates:populates} 
		= loadContextVars(req);
  //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
  let briefView = views[0];
	
  let populateArray = [];
  populates.briefView.forEach( (p)=> {
		//an array, with [field, ref]
		let fields = getPopulatesRefFields(p[1]);
		if (fields != null) //only push when the ref schema is found
			populateArray.push({ path: p[0], select: fields });
  });
  let query = {};

  //get the query parameters ?a=b&c=d, but filter out unknown ones
	
  const PER_PAGE = 25, MAX_PER_PAGE = 1000;
	
  let __page = 1;
  let __per_page = PER_PAGE;
	
  for (let prop in req.query) {
		if (prop === "__page") __page = parseInt(req.query[prop]);
		else if (prop === "__per_page") __per_page = parseInt(req.query[prop]);
		else if (prop in schema.paths) {
			query[prop] = req.query[prop];
		}
  }
	
  let count = 0;
  if (searchContext) {
        //console.log("searchContext is ....", searchContext);
        // searchContext ={'$and', [{'$or', []},{'$and', []}]}
		if (searchContext['$and']) {
		  for (let subContext of searchContext['$and']) {
			  if ('$or' in subContext) {
				  if (subContext['$or'].length == 0) subContext['$or'] = [{}];
				  subContext['$or']=subContext['$or'].map(x=>createRegex(x));
			  } else if ( '$and' in subContext) {
				  if (subContext['$and'].length == 0) subContext['$and'] = [{}];
				  subContext['$and']=subContext['$and'].map(x=>checkAndSetValue(x,schema));
			  }
		  }
		}
		query = searchContext;
		//console.log("query is ....", query['$and'][0]['$or'], query['$and'][1]['$and']);
  }

  model.countDocuments(query).exec(function(err, cnt) {
        if (err) { return next(err); }
        count = cnt;
        
        if (isNaN(__per_page) || __per_page <= 0) __per_page = PER_PAGE;
        else if (__per_page > MAX_PER_PAGE) __per_page = MAX_PER_PAGE;

    	let maxPageNum = Math.ceil(count/(__per_page*1.0));

    	if (isNaN(__page)) __page = 1;
    	if (__page > maxPageNum) __page = maxPageNum;
    	if (__page <= 0) __page = 1;
    	
    	let skipCount = (__page - 1) * __per_page;
    	
    	let dbExec = model.find(query, briefView)
            .skip(skipCount)
            .limit(__per_page)
        for (let pi = 0; pi < populateArray.length; pi ++) {
        	let p = populateArray[pi];
        	dbExec = dbExec.populate(p);
        }
    	dbExec.exec(function(err, result) {
                if (err) return next(err)
                let output = {
                	total_count: count,
                	total_pages: maxPageNum,
                	page: __page,
                	per_page: __per_page,
                	items: result
                }
                return res.send(output);
            })        
  })
};
	
RestController.getDetailsById = function(req, res, next) {
	let {name: name, schema: schema, model: model, views: views, populates:populates} 
			= loadContextVars(req);
	//views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
	let detailView = views[1];

	let populateArray = [];
	populates.detailView.forEach( (p)=> {
		//an array, with [field, ref]
		let fields = getPopulatesRefFields(p[1]);
		if (fields != null) //only push when the ref schema is found
			populateArray.push({ path: p[0], select: fields });
	});
	let query = {};

	let idParam = name + "Id";
	let id = req.params[idParam];
	
	let dbExec = model.findById(id, detailView)
	for (let pi = 0; pi < populateArray.length; pi ++) {
		let p = populateArray[pi];
		dbExec = dbExec.populate(p);
	}
	dbExec.exec(function (err, result) {
		if (err) { return next(err); }
		return res.send(result);
	});
};
	
RestController.HardDeleteById = function(req, res, next) {
	let {name: name, schema: schema, model: model, views: views} = loadContextVars(req);
	
	let idParam = name + "Id";
	let id = req.params[idParam];
	model.findByIdAndDelete(id).exec(function (err, result) {
		if (err) { return next(err); }
		return res.send();
	});
};

RestController.PostActions = function(req, res, next) {	
	let action = "";
	for (let prop in req.query) {
		if (prop === "action") action = req.query[prop];
	}
	
	let body = req.body;
	if (typeof body === "string") {
	    try {
	        body = JSON.parse(body);
	    } catch(e) {
	    	return next(createError(404, "Bad " + name + " document."));
	    }
	}

	switch(action) {
    case "DeleteManyByIds":
    	let ids = body;
        RestController.deleteManyByIds(req, res, next, ids);
        break;
    case "Search":
    	let searchContext = body;
    	RestController.searchAll(req, res, next, searchContext);
    	break;
    default:
    	return next(createError(404, "Bad Action: " + action));
	}
}

RestController.deleteManyByIds = function(req, res, next, ids) {
	let {name: name, schema: schema, model: model, views: views} = loadContextVars(req);

	model.deleteMany({"_id": {$in: ids}})
		.exec(function (err, result) {
		if (err) { return next(err); }
		return res.send();
	});
};

RestController.Create = function(req, res, next) {
	let {name: name, schema: schema, model: model, views: views} = loadContextVars(req);
	
	let body = req.body;
	if (typeof body === "string") {
	    try {
	        body = JSON.parse(body);
	    } catch(e) {
	    	return next(createError(404, "Bad " + name + " document."));
	    }
	}

	model.create(body, function (err, result) {
		if (err) { return next(err); }
		return res.send(result);
	});	
};

RestController.Update = function(req, res, next) {
	let {name: name, schema: schema, model: model, views: views} = loadContextVars(req);

    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch(e) {
            return next(createError(404, "Bad " + name + " document."));
        }
    }

	let idParam = name + "Id";
	let id = req.params[idParam];
	model.replaceOne({_id: id}, body, function (err, result) {
            if (err) { return next(err); }
            return res.send();
    });
};



RestController.ModelExecute = function(modelName, apiName, callBack, ...queryParams) {
  let model = model_collection[modelName];
  if (!model[apiName]) {
    let err = new Error("API doesn't exit in model: " + apiName);
    callBack(err, null);
  }
  model[apiName].apply(model, queryParams)
    .exec(function (err, result) {
      callBack(err, result);
    });
}


module.exports = RestController;