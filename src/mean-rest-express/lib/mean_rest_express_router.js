let mongoose = require('mongoose');
let express = require('express');
let createError = require('http-errors');

let addPasswordHandlers = require('../authn/password_handler');
let RestController = require('./mean_rest_express_controller')
let AuthnController = require('../authn/authn_controller')
let RestRouter = require('./mean_rest_express_sub_router')

function meanRestExpressRouter(sysDef) {
  let expressRouter = express.Router();
  let schemas = sysDef.schemas;
  
  let authUserFields = "username";
  if ("authUserFields" in sysDef.config) {
    authUserFields = sysDef.config["authUserFields"];
  }
  let authPasswordField = "password";
  if ("authPasswordField" in sysDef.config) {
    authPasswordField = sysDef.config["authPasswordField"];
  }
  let authSchemaName;
  if ("authUserSchema" in sysDef.config) {
    authSchemaName = sysDef.config["authUserSchema"];
    AuthnController.registerAuth(authSchemaName, authUserFields, authPasswordField);
  }

  let sub_routes = [];
  for (let schemaName in schemas) {
    var schemaDef = schemas[schemaName];
    //schemaDef.views in [briefView, detailView, CreateView, EditView, SearchView] sequence
    
    name = schemaName.toLowerCase();
    
    let schm = schemaDef.schema;

    if (schemaName == authSchemaName) {
      schm = addPasswordHandlers(schm, authPasswordField);
    }

    let model = mongoose.model(schemaName, schm, );//model uses given name
    RestController.register(name, schemaDef.schema, schemaDef.views, model);
    
    restRouter = RestRouter(name);
    expressRouter.use("/" + name, restRouter)
    sub_routes.push("/" + name);
  }
  
  if (!!authSchemaName) {
    sub_routes.push("/login");
    sub_routes.push("/register");

    expressRouter.post(
      "/login", 
      (req, res, next) => {
        AuthnController.authLogin(req, res, next);
      },
      (req, res, next) => {
        AuthnController.generateToken(req, res, next);
      }
    );

    expressRouter.post("/register", (req, res, next) => {
      AuthnController.authRegister(req, res, next);
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
