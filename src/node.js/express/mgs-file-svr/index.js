const FileExpressRouter = require('./lib/file.router');
const defaultFileModuleAuthzDef = {
  "module-authz": {"LoginUser": {"others": "CRUD", "own": ""}, "Anyone": "R"}
}

module.exports ={
  RestRouter: FileExpressRouter,
  defaultAuthzDef: defaultFileModuleAuthzDef
}