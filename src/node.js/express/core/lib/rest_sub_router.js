const express = require('express');
const RestControllerP = require('./rest_controller');

const _setSchemaName = function(name) {
  return function(req, res, next) {
    req.meanRestSchemaName = name;
    return next();
  }
}

const RestRouter = function(restController, schemaName, authzFunc, api) {  
  let router = express.Router();
  if (!api) return router;

  let setSchemaName = _setSchemaName(schemaName);
  let name = schemaName.toLowerCase();
  router.use(setSchemaName); 
  if (authzFunc) router.use(authzFunc);

  if (api.includes('L')) {
    router.get('/', restController.getAll.bind(restController));
    router.post('/mddsaction/get', restController.PostActions.bind(restController));
  }
  let idParam = name + 'Id';
  if (api.includes('R')) {
    router.get('/:' + idParam, restController.getDetailsById.bind(restController));
  }
  if (api.includes('C')) {
    router.put('/', restController.Create.bind(restController));
  }
  if (api.includes('U')) {
    router.post('/:' + idParam, restController.Update.bind(restController));
    router.get('/mddsaction/post/:' + idParam, restController.getDetailsById.bind(restController));
  }
  if (api.includes('D')) {
    router.delete('/:' + idParam, restController.HardDeleteById.bind(restController));
    router.post('/mddsaction/delete', restController.PostActions.bind(restController));
  }
  if (api.includes('A')) { // archive
    router.post('/mddsaction/archive', restController.PostActions.bind(restController));
    router.post('/mddsaction/unarchive', restController.PostActions.bind(restController));
  }
  if (api.includes('E')) { // export
    router.post('/mddsaction/export', restController.PostActions.bind(restController));
  }
  if (api.includes('M')) { // emailing
    router.post('/mddsaction/emailing', restController.PostActions.bind(restController));
  }
  return router;
}

module.exports = RestRouter
