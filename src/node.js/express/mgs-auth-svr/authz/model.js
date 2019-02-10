const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//User Roles
const roleSchema = new Schema({
  role: { type: String, required: true, index: { unique: true }, maxlength: 50 },
  description: { type: String, maxlength: 200}
});

const roleBrief = "role description";
const roleDetail = "role description";
const roleCreat = "role description";
const roleEdit = "role description";
const roleTextSearch = "role description";
const roleIndex = "role";

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
  role: { type: Schema.Types.ObjectId, ref: 'mrole', required: true },
  module: { type: Schema.Types.ObjectId, ref: 'mmodule', required: true }, 
  modulePermission: { type: String }, //"CRUD" 
  resourcePermission: {type: Map, of: String},  //{resource: "CRUD"}
});
//to make the association unique
permissionSchema.index({ role: 1, module: 1}, {unique: true}); // schema level

const permBrief = "role module modulePermission";
const permDetail = "role module modulePermission resourcePermission";
const permCreat = "role module modulePermission resourcePermission";
const permEdit = "role module modulePermission resourcePermission";
const permTextSearch = "role module";
const permIndex = "role"; //let's temporarily put any field here since this schema is not referred.


//Put all schemas together
const schemas = {
  "mrole": {
    schema: roleSchema,
    views: [roleBrief, roleDetail, roleCreat, roleEdit, roleTextSearch, roleIndex],
  },
  "mmodule": {
    schema: moduleSchema,
    views: [moduleBrief, moduleDetail, moduleCreat, moduleEdit, moduleTextSearch, moduleIndex],
  },
  "mpermission": {
    schema: permissionSchema,
    views: [permBrief, permDetail, permCreat, permEdit, permTextSearch, permIndex],
  },
};

const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = { //only users with permission can see this module
  "module-authz": {"LoginUser": {"others": "CRUD", "own": "CURD"}, "Anyone": ""},
}

const GetAuthzDef = function(userSchemaName, userSchema) {
  schemas[userSchemaName] = userSchema;
  
  //define user<->role schema
  const userRoleSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: userSchemaName, required: true, index: { unique: true } },
    role: { type: [{type: Schema.Types.ObjectId, ref: 'mrole'}] }, 
  });
  
  const userRoleBrief = "user, role";
  const userRoleDetail = "user, role";
  const userRoleCreat = "user, role";
  const userRoleEdit = "user, role";
  const userRoleTextSearch = "user, role";
  const userRoleIndex = "user"; //let's temporarily put any field here since this schema is not referred.
  
  schemas['userRole'] = {
    schema: userRoleSchema,
    views: [userRoleBrief, userRoleDetail, userRoleCreat, userRoleEdit, userRoleTextSearch, userRoleIndex],
  }
  
  return {schemas: schemas, config: config, authz: authz};
}


module.exports = GetAuthzDef;
