const getPermissionFromAuthz = require('./authz_util');

class PermissionStore {
  permission_collection = {}; 
  access_collection = {}; 

  system_modules = {}; //{'moduleName': [resource1, resource2...]}

  constructor() { }
  registerAuthz(moduleName, authz) {
    this.access_collection[moduleName] = getPermissionFromAuthz(authz);
  }
  getPermission(moduleName) {
    return this.permission_collection[moduleName];
  }
  setPermissions(modulePermissions) {
    for (let moduleName in modulePermissions) {
      this.permission_collection[moduleName] = modulePermissions[moduleName];
    }
  }
  getAccess(moduleName) {
    return this.access_collection[moduleName];
  }
  setAccesses(modulePermissions) {
    for (let moduleName in modulePermissions) {
      this.access_collection[moduleName] = modulePermissions[moduleName];
    }
  }
  registerResource(schemaName, moduleName) {
    if (moduleName) {
      if (moduleName in this.system_modules) {
        if (!this.system_modules[moduleName].includes(schemaName)) {
          this.system_modules[moduleName].push(schemaName);
        }
      }
      else {
        this.system_modules[moduleName] = [schemaName];
      }
    }
  }
  getAllModules() {
    return this.system_modules;
  }
}

module.exports = PermissionStore;
