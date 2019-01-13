const express = require('express');

const RestController = require('./rest_controller')
const AuthnController = require('../authn/authn_controller')

const _setRouterName = function(name) {
  return function(req, res, next) {
    req.meanRestRouteName = name;
    next();
  }
}

const RestRouter = function(name) {
  let router = express.Router();

  let setRouterName = _setRouterName(name);
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
