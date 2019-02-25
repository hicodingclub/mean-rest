const express = require('express');

const RestController = require('./rest_controller')

const _setSchemaName = function(name) {
  return function(req, res, next) {
    req.meanRestSchemaName = name;
    next();
  }
}

const RestRouter = function(schemaName, authzFunc) {
  let router = express.Router();

  let setSchemaName = _setSchemaName(schemaName);
  let name = schemaName.toLowerCase();
  router.use(setSchemaName); 
  if (authzFunc) router.use(authzFunc);

  router.get('/', RestController.getAll);

  let idParam = name + "Id";
  router.get('/:' + idParam, RestController.getDetailsById);

  router.put('/', RestController.Create);
  router.post('/:' + idParam, RestController.Update);
  router.delete('/:' + idParam, RestController.HardDeleteById);

  router.post('/', RestController.PostActions);
  return router;
}

module.exports = RestRouter
