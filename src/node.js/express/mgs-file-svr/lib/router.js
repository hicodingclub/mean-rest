const express = require('express');
const createError = require('http-errors');
const fileUpload = require('express-fileupload');

const meanRestExpress = require('mean-rest-express');

const FileController = require('./controller')

const FileExpressRouter = function(sysDef, moduleName, authConfig, options) {
  
  //create basic rest router based on the sysDef
  let restRouter = meanRestExpress.RestRouter(sysDef, moduleName, authConfig);
  FileController.setOption(moduleName, options);
  FileController.setConfig(moduleName, sysDef.config);

  let router;
  //1. load "upload" router for file upload
  router = express.Router();
  router.use(fileUpload());
  router.post("/", FileController.Create);
  router.post("/:fileID", FileController.Replace);
  restRouter = meanRestExpress.RestRouter.Hook(restRouter, "upload", router);
  //2. load "download" router for file download
  router = express.Router();
  router.get("/:fileID", FileController.Download);
  restRouter = meanRestExpress.RestRouter.Hook(restRouter, "download", router);  
  //3. load "delete" router for file delete

  return restRouter;
}

module.exports = FileExpressRouter;