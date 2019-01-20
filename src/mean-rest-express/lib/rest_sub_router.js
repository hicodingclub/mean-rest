const express = require('express');

const RestController = require('./rest_controller')

const _setRouterName = function(name) {
  return function(req, res, next) {
    req.meanRestRouteName = name;
    next();
  }
}

const RestRouter = function(name, authzFunc) {
  let router = express.Router();

  let setRouterName = _setRouterName(name);
  router.use(setRouterName); 
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
