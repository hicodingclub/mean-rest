const getPermissionFromAuthz = require('./authz_util');

const permission_collection = {}; 
const access_collection = {}; 

const system_modules = {}; //{'moduleName': [resource1, resource2...]}


const PermissionStore = function() {};

PermissionStore.registerAuthz = function(moduleName, authz) {
  access_collection[moduleName] = getPermissionFromAuthz(authz);
};

PermissionStore.getPermission = function(moduleName) {
  return permission_collection[moduleName];
};

PermissionStore.setPermissions = function(modulePermissions) {
  for (let moduleName in modulePermissions) {
    permission_collection[moduleName] = modulePermissions[moduleName];
  }
};
PermissionStore.getAccess = function(moduleName) {
  return access_collection[moduleName];
};

PermissionStore.setAccesses = function(modulePermissions) {
  for (let moduleName in modulePermissions) {
    access_collection[moduleName] = modulePermissions[moduleName];
  }
};

PermissionStore.registerResource = function(schemaName, moduleName){
  if (moduleName) {
    if (moduleName in system_modules) {
      if (!system_modules[moduleName].includes(schemaName)) {
        system_modules[moduleName].push(schemaName);
      }
    } else {
      system_modules[moduleName] = [schemaName];
    }
  }
};

PermissionStore.getAllModules = function() {
  return system_modules;
};

module.exports = PermissionStore;
