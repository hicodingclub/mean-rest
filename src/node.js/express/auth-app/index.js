const meanRestExpress = require('mean-rest-express')
const restController = meanRestExpress.restController;

const verifyToken = require('./lib/authn')
const verifyPermission = require('./lib/authz')

const authFuncs = {
  "authnFunc": verifyToken,
  "authzFunc": verifyPermission
}

const moduleIds = {};
const roleIds = {};
const modulePermissions = {};

function modelExecuteSuccess(taskStr) {
  function doSomething(result) {
    console.log(" --- auth app: model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- auth app: model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- auth app: model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- auth app: model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}

const uploadModulesAndPermissionsLocal = async function() {
  let takInfo;
  let anyoneRoleId, loginUserOwnId, loginUserOthersId;
  let roleArr = ['Anyone', 'LoginUserOwn', 'LoginUserOthers'];
  for (let ar of roleArr) {
    takInfo = `get "${ar}" role infomation...`;
    let rId;
    await restController.ModelExecute(
            "mrole",
            "findOne",
            {role: ar}//search criteria
        ).then(function(result) {
            if (result) rId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    roleIds[ar] = rId;
  }
  
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    takInfo = "update modules " + m + " with resources: " + modules[m];
    await restController.ModelExecute(
            "mmodule",
            "updateOne",
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    takInfo = `get "${m}" module infomation...`;
    let mModuleId;
    await restController.ModelExecute(
            "mmodule",
            "findOne",
            {module: m}//search criteria
        ).then(function(result) {
            if (result) mModuleId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    
    moduleIds[m] = mModuleId;//cached id for later use
    
    let authz = restController.getPermission(m);
    // authz: permission array [{'role': {...}, 'modulePermission':xxx, 'resourcePermission':{...}}, ...]
    for (let ar of roleArr) {
      let rId = roleIds[ar];
      let rNm = ar;
      if (rId && mModuleId && authz) {
        let azFilter = authz.filter(x=>x.role.role == rNm);
        let az = {
                'role': {'role': rNm},
                'modulePermission': undefined,
                'resourcePermission': {}
            };
        if (azFilter.length > 0) {
          az = azFilter[0];
        }
        let doc = {role: rId, module: mModuleId, resourcePermission:{}};
        
        let defined = false;
        
        if (az['modulePermission']) {
          doc['modulePermission'] = az['modulePermission'];
          defined = true;
        }
        for (let sch in az['resourcePermission']) {
          if (az['resourcePermission'][sch]) {
            doc['resourcePermission'][sch] = az['resourcePermission'][sch];
            defined = true;
          }
        }
        if (!defined) continue;  //only insert if there are any permissions defined 
        takInfo = `insert permission for "${rNm}" role for "${m}" module...`;
        restController.ModelExecute(
                "mpermission",
                "create",
                doc //document
            ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
      }    
    }
  }
}

const downloadRolesAndPermissionsLocal = async function() {
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    let mModuleId = moduleIds[m];
    if (mModuleId) {
      takInfo = `get "${m}" module permisions...`;
      await restController.ModelExecute2(
              "mpermission",
              {'find': [{module: mModuleId}], //search criteria
               'populate': ['role', 'role'] //return role name for the role reference.
              }
          ).then(function(result) {
              if (result) {
                modulePermissions[m] = result;
              }
            }, 
            modelExecuteError(takInfo));
    } else {
      console.warning(` --- Warning: auth app: module "${m}" not found in system.`);
    }
  }
  restController.setPermissions(modulePermissions);
}

const run = function(authServerUrl, appKey, appSecrete) {
  //1. upload modules and initial permissions
  if (authServerUrl == 'local') {
    //wait until auth-server finished insert roles
    setTimeout(uploadModulesAndPermissionsLocal, 3000);
  }
  
  //2. download roles and permissions periodically
  if (authServerUrl == 'local') {
    setTimeout(downloadRolesAndPermissionsLocal, 6000);
    setInterval(downloadRolesAndPermissionsLocal, 1000*60);
  }
}
module.exports = {
  authFuncs: authFuncs,
  run: run
}
