var express = require('express');

var RestController = require('./mean_rest_express_controller')
var AuthnController = require('../authn/authn_controller')

function _setRouterName(name) {
  return function(req, res, next) {
    req.meanRestRouteName = name;
    next();
  }
}

function RestRouter(name) {
  var router = express.Router();

  var setRouterName = _setRouterName(name);
  router.use(setRouterName); 
  router.use(AuthnController.verifyToken); //verifyToken and set user

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
