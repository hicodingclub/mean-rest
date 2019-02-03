const mongoose = require('mongoose');
const express = require('express');
const createError = require('http-errors');

const RestController = require('./rest_controller')
const RestRouter = require('./rest_sub_router')

const meanRestExpressRouter = function(sysDef, authConfig) {
  let expressRouter = express.Router();
  let schemas = sysDef.schemas;
  
  let authzFuncCreator;
  if (authConfig) {
    let authnFunc = authConfig.authnFunc;
    if (authnFunc) expressRouter.use(authnFunc);

    authzFuncCreator = authConfig.authzFuncCreator;
  }
  //console.log("*******sysDef", sysDef)

  let sub_routes = [];
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    
    let name = schemaName.toLowerCase();
    let schm = schemaDef.schema;
    schm.set('toObject', {getters: false, virtuals: true});
    schm.set('toJSON', {getters: false, virtuals: true});
    let model = mongoose.model(schemaName, schm );//model uses given name
    RestController.register(name, schemaDef.schema, schemaDef.views, model);
  }

  for (let schemaName in schemas) {
    let name = schemaName.toLowerCase();
    let authzFunc;
    if (sysDef.authz && authzFuncCreator) {
        authzFunc = authzFuncCreator(schemaName, sysDef.authz);
    }
    restRouter = RestRouter(name, authzFunc);

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
