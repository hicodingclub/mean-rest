let mongoose = require('mongoose');
let express = require('express');
let createError = require('http-errors');

let RestController = require('./mean_rest_express_controller')
let RestRouter = require('./mean_rest_express_sub_router')

function meanRestExpressRouter(sysDef) {
  let expressRouter = express.Router();
  let schemas = sysDef.schemas;
  
  let authSchemaName;
  if ("authUserSchema" in sysDef.config) {
    authSchemaName = sysDef.config["authUserSchema"];
  }
  let authUserNames = "username";
  if ("authUserNames" in sysDef.config) {
    authUserNames = sysDef.config["authUserNames"];
  }
  let authPassword = "password";
  if ("authPassword" in sysDef.config) {
    authPassword = sysDef.config["authPassword"];
  }

      
  let sub_routes = [];
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    
    name = schemaName.toLowerCase();
    
    let schm = schemaDef.schema;

    if (name == authSchemaName) {
      let authorize = require('../auth/authorize');
      schm = authorize(schm, authPassword);
    }
    
    let model = mongoose.model(schemaName, schm, );//model uses given name
    
    RestController.register(name, schemaDef.schema, schemaDef.views, model);
    
    restRouter = RestRouter(name);
    expressRouter.use("/" + name, restRouter)
    sub_routes.push(name);
  }
  
  if (!!authSchemaName) {
    expressRouter.post("/login", (req, res, next) => {
      RestController.authLogin(req, res, next, authSchemaName, authUserNames, authPassword);
    });    
    expressRouter.post("/register", (req, res, next) => {
      RestController.authRegister(req, res, next, authSchemaName, authUserNames, authPassword);
    });    
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
