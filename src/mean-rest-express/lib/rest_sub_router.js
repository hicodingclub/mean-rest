const express = require('express');

const RestController = require('./rest_controller')

const _setSchemaName = function(name) {
  return function(req, res, next) {
    req.meanRestSchemaName = name;
    next();
  }
}

const RestRouter = function(schemaName, authzFunc, api) {  
  let router = express.Router();
  if (!api) return router;

  let setSchemaName = _setSchemaName(schemaName);
  let name = schemaName.toLowerCase();
  router.use(setSchemaName); 
  if (authzFunc) router.use(authzFunc);

  if (api.includes("L")) {
    router.get('/', RestController.getAll);
    router.post('/mddsaction/get', RestController.PostActions);
  }
  let idParam = name + "Id";
  if (api.includes("R")) {
    router.get('/:' + idParam, RestController.getDetailsById);
  }
  if (api.includes("C")) {
    router.put('/', RestController.Create);
  }
  if (api.includes("U")) {
    router.post('/:' + idParam, RestController.Update);
    router.get('/mddsaction/post/:' + idParam, RestController.getDetailsById);
  }
  if (api.includes("D")) {
    router.delete('/:' + idParam, RestController.HardDeleteById);
    router.post('/mddsaction/delete', RestController.PostActions);
  }
  
  return router;
}

module.exports = RestRouter
