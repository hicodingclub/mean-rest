const mongoose = require('mongoose');
const express = require('express');
const createError = require('http-errors');

const RestController = require('./rest_controller')
const RestRouter = require('./rest_sub_router')


const processField = function(x) {
  let hidden = false;
  let field = x;
  let matches = x.match(/\((.*?)\)/);
  if (matches) {
    hidden = true;
    field = matches[1];
  }
  return [field, hidden];
}

var processViewStr = function(viewStr) {
  //1. remove virtical bar |, and split to array
  let fields = viewStr.replace(/\|/g, ' ').match(/\S+/g)
  //2. process each field
  fields = fields.map(x=>{
    let [f, hidden] = processField(x);
    return f;
  })
  //3. join to string
  viewStr = fields.join(" ");
  
  return viewStr;
}

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
    
    let name = schemaName.toLowerCase();
    let schm = schemaDef.schema;
    schm.set('toObject', {getters: false, virtuals: true});
    schm.set('toJSON', {getters: false, virtuals: true});
    let model = mongoose.model(schemaName, schm );//model uses given name
    
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    let views = [];
    for (let view of schemaDef.views) {
      view = processViewStr(view);
      //console.log("====view", view);
      views.push(view);
    }
    //pass pure view string to register.
    RestController.register(name, schemaDef.schema, views, model);
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
