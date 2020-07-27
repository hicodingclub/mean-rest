const FileExpressRouter = require('./lib/router');
const schemas = require('./model/schema');
const sampleAdminSysDef = require('./model/sample.admin');
const sampleUserOwnSysDef = require('./model/sample.user.own');
const sampleUserSysDef = require('./model/sample.user');

module.exports = {
  ExpressRouter: FileExpressRouter,
  schemas,
  sampleAdminSysDef,
  sampleUserOwnSysDef,
  sampleUserSysDef,
}