var mongoose = require('mongoose');
var express = require('express');
var createError = require('http-errors');

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
  
  
  //not supported api
  expressRouter.use(function(req, res, next) {
    next(createError(404));
  });
  
  //error handler
  expressRouter.use(function(err, req, res, next) {     
    var e = {"error": err.message,
      "status": err.status || 500};
    if (req.app.get('env') === 'development') {
        e.details = err.stack
      }
     
      // render the error page
    res.status(err.status || 500);
    res.json(e);
  });

	return expressRouter;
}

module.exports.RestRouter = meanRestExpressRouter;
module.exports.RestController = RestController;
