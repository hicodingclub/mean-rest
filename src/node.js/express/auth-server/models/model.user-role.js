const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//User Roles
const roleSchema = new Schema({
  role: { type: String, required: true, index: { unique: true }, maxlength: 50 },
  description: { type: String, maxlength: 200}
}, {autoIndex: true});

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
}, {autoIndex: true});

const moduleBrief = "module resources";
const moduleDetail = "module resources";
const moduleCreat = "module resources";
const moduleEdit = "module resources";
const moduleTextSearch = "module resources";
const moduleIndex = "module";

//Permission
const permissionSchema = new Schema({
  role: { type: Schema.Types.ObjectId, ref: 'mpubrole', required: true },
  module: { type: Schema.Types.ObjectId, ref: 'mpubmodule', required: true }, 
  modulePermission: { type: String }, //"CRUD" 
  resourcePermission: {type: Map, of: String},  //{resource: "CRUD"}
}, {autoIndex: true});
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
  "mpubrole": {
    schema: roleSchema,
    views: [roleBrief, roleDetail, roleCreat, roleEdit, roleTextSearch, roleIndex],
    tags: ['auth-role'], // used as authentication 'role' model
    name: 'Role',
    mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid',],
        },
        select: {
          views: ['table', 'list',],
        },
        sub: {
          views: ['table', 'list',],
        }
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
    },
  },
  "mpubmodule": {
    schema: moduleSchema,
    views: [moduleBrief, moduleDetail, moduleCreat, moduleEdit, moduleTextSearch, moduleIndex],
    tags: ['auth-module'], // used as authentication 'module' model
    name: 'System Module',
    mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid',],
        },
        select: {
          views: ['table', 'list',],
        },
        sub: {
          views: ['table', 'list',],
        }
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
    },
  },
  "mpubpermission": {
    schema: permissionSchema,
    views: [permBrief, permDetail, permCreat, permEdit, permTextSearch, permIndex],
    tags: ['auth-permission'], // used as authentication 'permission' model
    name: 'Permission',
    mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid',],
        },
        select: {
          views: ['table', 'list',],
        },
        sub: {
          views: ['table', 'list',],
        }
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
    },
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

const GetAuthzModuleDef = function(userSchemaName, userSchema) {
  schemas[userSchemaName] = userSchema;
  
  //define account<->role schema
  const accountRoleSchema = new Schema({
    account: { type: Schema.Types.ObjectId, ref: userSchemaName, required: true, index: { unique: true } },
    role: { type: [{type: Schema.Types.ObjectId, ref: 'mpubrole'}] }, 
  });

  const accountRoleBrief = "account role";
  const accountRoleDetail = "account role";
  const accountRoleCreat = "account role";
  const accountRoleEdit = "account role";
  const accountRoleTextSearch = "account role";
  const accountRoleIndex = "account"; //let's temporarily put any field here since this schema is not referred.
  
  schemas['muserRole'] = {
    schema: accountRoleSchema,
    views: [accountRoleBrief, accountRoleDetail, accountRoleCreat, 
      accountRoleEdit, accountRoleTextSearch, accountRoleIndex],
    tags: ['auth-user-role'],
    name: 'User Role',
    mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid',],
        },
        select: {
          views: ['table', 'list',],
        },
        sub: {
          views: ['table', 'list',],
        }
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
    },
  }
  
  return {schemas: schemas, config: config, authz: authz, DB_CONFIG};
}

module.exports = GetAuthzModuleDef;
