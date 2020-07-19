const verifyToken = require('./lib/authn');
const getAuthz = require('./lib/authz');

const PermissionStore = require('./lib/permission.store');
const dbOperation = require('./defaultDbOperations');

class AuthApp {
  permissionStore = new PermissionStore();
  authz = getAuthz(this.permissionStore);
  authFuncs = {
    "authnFunc": verifyToken,
    "authzFunc": this.authz.verifyPermission,
    "setPermissionFunc": this.authz.setModulePermission,
    "permissionStore": this.permissionStore
  };

  getAuthFuncs(option) { //option = {authz: 'group'}, or 'role'
    // group, or role
    if (option) {
      if (option.authz == 'role') {
        this.authFuncs.authzFunc = this.authz.verifyRolePermission;
      } else {
        this.authFuncs.authzFunc = this.authz.verifyPermission;
      }
    }
    return this.authFuncs;
  }

  run(authServerUrl, appKey, appSecrete, localRouter, options) {
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
        setTimeout( async () => {
          await dbOperation.uploadGroupsModulesAndAccessLocal(accessModules, localRouter.restController, this.permissionStore);
          await dbOperation.downloadGroupsAndAccessLocal(accessModules, localRouter.restController, this.permissionStore);
         }, 1000);
      }
  
      //2. download roles and permissions periodically
      if (localRouter) {
        setTimeout( async () => {
          dbOperation.downloadGroupsAndAccessLocal(accessModules, localRouter.restController, this.permissionStore);
        }, 1000*60);
      }
    }
    
    if (roleModules.length > 0) {//manages admin module authorization
      //1. upload modules and initial permissions
      if (localRouter) {
        //wait until auth-server finished insert roles
        setTimeout( async () => {
          await dbOperation.uploadRoleModulesLocal(roleModules, localRouter.restController, this.permissionStore);
          await dbOperation.downloadRoleAndPermissionsLocal(roleModules, localRouter.restController, this.permissionStore);
        }, 1000);
      }
  
      //2. download roles and permissions periodically
      if (localRouter) {
        setInterval( async () => {
          dbOperation.downloadRoleAndPermissionsLocal(roleModules, localRouter.restController, this.permissionStore);
        }, 1000*60);
      }
    }
  }
}

module.exports = AuthApp;
