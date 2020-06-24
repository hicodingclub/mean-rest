const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//User Roles
const roleSchema = new Schema({
  group: { type: String, required: true, index: { unique: true }, maxlength: 50 },
  description: { type: String, maxlength: 200}
});

const roleBrief = "group description";
const roleDetail = "group description";
const roleCreat = "group description";
const roleEdit = "group description";
const roleTextSearch = "group description";
const roleIndex = "group";

//System Modules
const moduleSchema = new Schema({
  module: { type: String, required: true, index: { unique: true }},
  resources: {type: [String]},
});

const moduleBrief = "module resources";
const moduleDetail = "module resources";
const moduleCreat = "module resources";
const moduleEdit = "module resources";
const moduleTextSearch = "module resources";
const moduleIndex = "module";

//Permission
const permissionSchema = new Schema({
  group: { type: Schema.Types.ObjectId, ref: 'musergroup', required: true },
  module: { type: Schema.Types.ObjectId, ref: 'mpubmodule', required: true }, 
  modulePermission: { type: String }, //"CRUD" 
  resourcePermission: {type: Map, of: String},  //{resource: "CRUD"}
});
//to make the association unique
permissionSchema.index({ group: 1, module: 1}, {unique: true}); // schema level

const permBrief = "group module modulePermission";
const permDetail = "group module modulePermission resourcePermission";
const permCreat = "group module modulePermission resourcePermission";
const permEdit = "group module modulePermission resourcePermission";
const permTextSearch = "group module";
const permIndex = "group"; //let's temporarily put any field here since this schema is not referred.


//Put all schemas together
const schemas = {
  "musergroup": {
    schema: roleSchema,
    views: [roleBrief, roleDetail, roleCreat, roleEdit, roleTextSearch, roleIndex],
    name: 'User Group'
  },
  "mpubmodule": {
    schema: moduleSchema,
    views: [moduleBrief, moduleDetail, moduleCreat, moduleEdit, moduleTextSearch, moduleIndex],
    name: 'Public Module'
  },
  "mpubaccess": {
    schema: permissionSchema,
    views: [permBrief, permDetail, permCreat, permEdit, permTextSearch, permIndex],
    name: 'Access Control'
  }
};

const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = { //only users with permission can see this module
  "module-authz": {"LoginUser": {"others": "", "own": ""}, "Anyone": ""},
}

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'AUTH',
};

module.exports = {schemas: schemas, config: config, authz: authz, DB_CONFIG};
