const meanRestExpress = require('@hicoder/express-core');
const restController = meanRestExpress.restController;

const verifyToken = require('./lib/authn');
const authz = require('./lib/authz');

const PermissionStore = require('./lib/permission.store');

const authFuncs = {
  "authnFunc": verifyToken,
  "authzFunc": authz.verifyPermission,
  "setPermissionFunc": authz.setModulePermission,
  "permissionStore": PermissionStore
};

const dbOperation = require('./defaultDbOperations');

const run = function(authServerUrl, appKey, appSecrete, localRouter, options) {
  //options: {'roleModules': [], 'accessModules': []}
  let accessModules = [];
  let roleModules = [];
  if (options && options['accessModules']) {
    accessModules = options['accessModules'];
  }
  if (options && options['roleModules']) {
    roleModules = options['roleModules'];
  }

  if (accessModules.length > 0) {//manages public module authorization
    //1. upload modules and initial permissions
    
    if (localRouter) {
      //wait until auth-server finished insert roles
      setTimeout(dbOperation.uploadPublicModulesAndAccessLocal, 3000, accessModules, localRouter.restController);
    }

    //2. download roles and permissions periodically
    if (localRouter) {
      setTimeout(dbOperation.downloadPublicGroupsAndAccessLocal, 6000, accessModules, localRouter.restController);
      setInterval(dbOperation.downloadPublicGroupsAndAccessLocal, 1000*60, accessModules, localRouter.restController);
    }
  }
  
  if (roleModules.length > 0) {//manages admin module authorization
    //1. upload modules and initial permissions

    if (localRouter) {
      //wait until auth-server finished insert roles
      setTimeout(dbOperation.uploadAdminModulesLocal, 3000, roleModules, localRouter.restController);
    }

    //2. download roles and permissions periodically
    if (localRouter) {
      setTimeout(dbOperation.downloadAdminRoleAndPermissionsLocal, 6000, roleModules, localRouter.restController);
      setInterval(dbOperation.downloadAdminRoleAndPermissionsLocal, 1000*60, roleModules, localRouter.restController);
    }
  }
}

module.exports = {
  authFuncs: authFuncs,
  run: run
}
