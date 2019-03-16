const express = require('express');
const createError = require('http-errors');
const fileUpload = require('express-fileupload');

const FileController = require('./file.controller')

const FileExpressRouter = function(authzDef, moduleName, authConfig) {
  let expressRouter = express.Router();
  if (!moduleName) moduleName = randomString(10);

//  let authzFunc = function
  if (authConfig) {
    let authnFunc = authConfig.authnFunc;
    if (authnFunc) expressRouter.use(authnFunc);

    authzFunc = authConfig.authzFunc;
    let permissionStore = authConfig.permissionStore;
    let setPermissionFunc = authConfig.setPermissionFunc;
    
    if (!authzDef) authzDef = {};
    permissionStore.registerAuthz(moduleName, authzDef);
    
    let setModuleAuthz = setPermissionFunc(moduleName);
    expressRouter.use(setModuleAuthz); 

    permissionStore.registerResource("upload", moduleName);
    permissionStore.registerResource("download", moduleName);
    permissionStore.registerResource("metadata", moduleName);
  }

  const _setSchemaName = function(req, res, next) {
    let paths = req.path.split('/');
    if (paths.length >= 2 && paths[1]) {
      req.meanRestSchemaName = paths[1];
    }
    next();
  }
  expressRouter.use(_setSchemaName);
  
  if (authzFunc) expressRouter.use(authzFunc);
  expressRouter.use(fileUpload());
  
  expressRouter.post('/upload', FileController.Create); //post or put a new file
  expressRouter.put('/upload', FileController.Create); //post or put a new file
//  expressRouter.post('/upload/:fileId', FileController.Update);
//  expressRouter.delete('/upload/:fileId', FileController.HardDeleteById);
//
//  expressRouter.get('/download/:fileId', FileController.downloadById);
//
//  expressRouter.post('/metadata/:fileId', FileController.updateMetadataById);
//
  expressRouter.get("/", (req, res, next) => {
    res.send(['upload', 'download', 'metadata']);
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

module.exports = FileExpressRouter;