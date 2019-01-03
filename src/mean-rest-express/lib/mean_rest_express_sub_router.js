var express = require('express');

var RestController = require('./mean_rest_express_controller')

function _setRouterName(name) {
  return function(req, res, next) {
    req.meanRestRouteName = name;
    next();
  }
}

function RestRouter(name) {
  var router = express.Router();

  var middlewareFunc = _setRouterName(name);

  router.get('/', middlewareFunc, RestController.getAll);
  let idParam = name + "Id";
  router.get('/:' + idParam, middlewareFunc, RestController.getDetailsById);
  router.put('/', middlewareFunc, RestController.Create);
  router.post('/:' + idParam, middlewareFunc, RestController.Update);
  router.delete('/:' + idParam, middlewareFunc, RestController.HardDeleteById);

  router.post('/', middlewareFunc, RestController.PostActions);
  return router;
}

module.exports = RestRouter
