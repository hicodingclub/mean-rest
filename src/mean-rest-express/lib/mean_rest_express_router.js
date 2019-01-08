let mongoose = require('mongoose');
let express = require('express');
let createError = require('http-errors');

let RestController = require('./mean_rest_express_controller')
let RestRouter = require('./mean_rest_express_sub_router')

const meanRestExpressRouter = function(sysDef, extraRoutes) {
  let expressRouter = express.Router();
  let schemas = sysDef.schemas;
  
  let sub_routes = [];
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    
    let name = schemaName.toLowerCase();
    let schm = schemaDef.schema;
    let model = mongoose.model(schemaName, schm );//model uses given name
    RestController.register(name, schemaDef.schema, schemaDef.views, model);
    
    restRouter = RestRouter(name);
    expressRouter.use("/" + name, restRouter)
    sub_routes.push("/" + name);
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
    let e = {"error": err.message,
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

module.exports = meanRestExpressRouter;
