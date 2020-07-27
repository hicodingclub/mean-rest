const express = require('express');
const RestControllerP = require('./rest_controller');

const _setSchemaName = function(name) {
  return function(req, res, next) {
    req.meanRestSchemaName = name;
    return next();
  }
}

const RestRouter = function(restController, schemaName, authzFunc, api, filters, zInterfaces) {  
  let router = express.Router();
  if (!api) return router;

  let setSchemaName = _setSchemaName(schemaName);
  let name = schemaName.toLowerCase();
  router.use(setSchemaName); 
  if (authzFunc) router.use(authzFunc);

  if (api.includes('L')) {
    router.get('/', restController.getAll.bind(restController));
    router.post('/mddsaction/getfieldvalues', restController.PostActions.bind(restController));
    router.post('/mddsaction/get', restController.PostActions.bind(restController));
  }
  let idParam = name + 'Id';
  if (api.includes('R')) {
    router.get('/:' + idParam, restController.getDetailsById.bind(restController));
  }
  if (api.includes('C')) {
    let middlewares = [];
    if (filters.create) {
      middlewares = middlewares.concat(filters.create);
    }
    middlewares.push(restController.Create.bind(restController));
    router.put('/', middlewares);

    if (zInterfaces.create) {
      for (let itf of zInterfaces.create) {
        const setZInterfacename = function(req, res, next) {
          req.zInterface = {
            name: itf.name,
            action: 'create',
          };
          next();
        }
        let middlewares = [setZInterfacename, restController.zInterfaceCall.bind(restController)];
        router.post(`/mddsaction/put-z/${itf.name}`, middlewares);
      }
    }
  }
  if (api.includes('U')) {
    let middlewares = [];
    if (filters.update) {
      middlewares = middlewares.concat(filters.update);
    }
    middlewares.push(restController.Update.bind(restController));
    router.post('/:' + idParam, middlewares);
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
