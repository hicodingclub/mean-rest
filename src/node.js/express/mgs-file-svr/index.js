const FileExpressRouter = require('./lib/router');
const schemas = require('./model/schema');
const sampleAdminSysDef = require('./model/sample.admin');
const sampleUserSysDef = require('./model/sample.user');

module.exports = {
  ExpressRouter: FileExpressRouter,
  schemas,
  sampleAdminSysDef,
  sampleUserSysDef,
}