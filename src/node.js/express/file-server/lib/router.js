const express = require('express');
const fileUpload = require('express-fileupload');

const meanRestExpress = require('@hicoder/express-core');

const FileController = require('./controller')

const FileExpressRouter = function(sysDef, moduleName, authConfig, options) {
  const fileController = new FileController();
  
  //create basic rest router based on the sysDef
  let restRouter = meanRestExpress.RestRouter(sysDef, moduleName, authConfig);
  fileController.setOption(moduleName, options);
  fileController.setConfig(moduleName, sysDef.config);

  let router;
  //1. load 'upload' router for file upload
  router = express.Router();
  router.use(fileUpload());
  router.post('/', fileController.Create.bind(fileController));
 // router.post('/:fileID', FileController.Replace);
  restRouter = meanRestExpress.RestRouter.Hook(restRouter, 'upload', router);
  //2. load 'download' router for file download
  router = express.Router();
  router.get('/users*', fileController.DownloadUsers.bind(fileController)); // download user specific files
  router.get('/:fileID', fileController.Download.bind(fileController));
  restRouter = meanRestExpress.RestRouter.Hook(restRouter, 'download', router);  
  //3. load "delete" router for file delete

  return restRouter;
}

module.exports = FileExpressRouter;
