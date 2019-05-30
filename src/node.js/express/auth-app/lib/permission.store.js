const getPermissionFromAuthz = require('./authz_util');

const permission_collection = {}; 
const access_collection = {}; 

const system_modules = {}; //{'moduleName': [resource1, resource2...]}

class PermissionStore {
  constructor() { }
  static registerAuthz(moduleName, authz) {
    access_collection[moduleName] = getPermissionFromAuthz(authz);
  }
  static getPermission(moduleName) {
    return permission_collection[moduleName];
  }
  static setPermissions(modulePermissions) {
    for (let moduleName in modulePermissions) {
      permission_collection[moduleName] = modulePermissions[moduleName];
    }
  }
  static getAccess(moduleName) {
    return access_collection[moduleName];
  }
  static setAccesses(modulePermissions) {
    for (let moduleName in modulePermissions) {
      access_collection[moduleName] = modulePermissions[moduleName];
    }
  }
  static registerResource(schemaName, moduleName) {
    if (moduleName) {
      if (moduleName in system_modules) {
        if (!system_modules[moduleName].includes(schemaName)) {
          system_modules[moduleName].push(schemaName);
        }
      }
      else {
        system_modules[moduleName] = [schemaName];
      }
    }
  }
  static getAllModules() {
    return system_modules;
  }
}

module.exports = PermissionStore;
