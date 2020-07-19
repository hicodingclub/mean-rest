const groupModuleIds = {};
let groupAllModuleId;

const roleModuleIds = {};
let roleAllModuleId;

const userGroupIds = {};
const groupModuleAccess = {};
const roleModulePermissions = {};

function modelExecuteSuccess1(taskStr) {
  function doSomething(result) {
    console.log(" --- auth app (group access): model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError1(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- auth app (group access): model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- auth app (group access): model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- auth app (group access): model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}

const uploadGroupsModulesAndAccessLocal = async function(publicModules, restController, permissionStore) {
  const mgroup = restController.getModelNameByTag('auth-group');
  const mmodule = restController.getModelNameByTag('auth-module');
  const maccess = restController.getModelNameByTag('auth-access');

  let takInfo;
  let roleArr = ['Anyone', 'LoginUserOwn', 'LoginUserOthers'];
  for (let ar of roleArr) {
    takInfo = `get "${ar}" user group infomation...`;
    let rId;
    await restController.ModelExecute(
            mgroup,
            "findOne",
            {group: ar}//search criteria
        ).then(function(result) {
            if (result) rId = result['_id'];
          }, 
          modelExecuteError1(takInfo));
    userGroupIds[ar] = rId;
  }
  let modules = permissionStore.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (publicModules && !publicModules.includes(m)) continue; //modules not managed by this app
    
    takInfo = "update public modules " + m + " with resources: " + modules[m];
    await restController.ModelExecute(
            mmodule,
            "updateOne",
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        ).then(modelExecuteSuccess1(takInfo), modelExecuteError1(takInfo));
    takInfo = `get "${m}" public module infomation...`;
    let mModuleId;
    await restController.ModelExecute(
            mmodule,
            "findOne",
            {module: m}//search criteria
        ).then(function(result) {
            if (result) mModuleId = result['_id'];
          }, 
          modelExecuteError1(takInfo));
    
    groupModuleIds[m] = mModuleId;//cached id for later use
    
    let authz = permissionStore.getAccess(m);
    // authz: permission array [{'group': {...}, 'modulePermission':xxx, 'resourcePermission':{...}}, ...]
    for (let ar of roleArr) {
      let rId = userGroupIds[ar];
      let rNm = ar;
      if (rId && mModuleId && authz) {
        let azFilter = authz.filter(x=>x.group.group == rNm);
        let az = {
                'group': {'group': rNm},
                'modulePermission': undefined,
                'resourcePermission': {}
            };
        if (azFilter.length > 0) {
          az = azFilter[0];
        }
        let doc = {group: rId, module: mModuleId, resourcePermission:{}};
        
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
        takInfo = `insert permission for "${rNm}" user group and "${m}" public module...`;
        restController.ModelExecute(
                maccess,
                "create",
                doc //document
            ).then(modelExecuteSuccess1(takInfo), modelExecuteError1(takInfo));
      }    
    }
  }
  //get module ID for "All Modules"
  await restController.ModelExecute(
          mmodule,
          "findOne",
          {module: 'All Modules'}//search criteria
      ).then(function(result) {
          if (result) groupAllModuleId = result['_id'];
        }, 
        modelExecuteError1(takInfo));
}

const downloadGroupsAndAccessLocal = async function(publicModules, restController, permissionStore) {
  const maccess = restController.getModelNameByTag('auth-access');

  let modules = permissionStore.getAllModules();
  
  let reload = false;
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (publicModules && !publicModules.includes(m)) continue; //modules not managed by this app

    let mModuleId = groupModuleIds[m];
    if (mModuleId) {
      takInfo = `get "${m}" public module permisions...`;
      await restController.ModelExecute2(
              maccess,
              [
                ['find', [{module: mModuleId}]], //search criteria
                ['populate', ['group', 'group']], //return role name for the role reference.
                ['populate', ['module', 'module']] //return module name for the role reference.
              ]
          ).then(function(result) {
              if (result) {
                groupModuleAccess[m] = result;
              }
            }, 
            modelExecuteError1(takInfo));
    } else {
      console.warn(` --- Warning: auth app: public module "${m}" not found in system.`);
      reload = true;
      break;
    }
  }
  if (reload) {
    uploadGroupsModulesAndAccessLocal(publicModules, restController);
    return;
  }

  if (groupAllModuleId) {
    takInfo = `get "All Modules" public module permisions...`;
    await restController.ModelExecute2(
            maccess,
            [
              ['find', [{module: groupAllModuleId}]], //search criteria
              ['populate', ['group', 'group']], //return role name for the role reference.
              ['populate', ['module', 'module']] //return module name for the role reference.
            ]
        ).then(function(result) {
            if (result) {
              groupModuleAccess["All Modules"] = result;
            }
          }, 
          modelExecuteError1(takInfo));
  }
  permissionStore.setAccesses(groupModuleAccess);
}

function modelExecuteSuccess2(taskStr) {
  function doSomething(result) {
    console.log(" --- auth app (role access): model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError2(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- auth app (role access): model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- auth app (role access): model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- auth app (role access): model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}

const uploadRoleModulesLocal = async function(adminModules, restController, permissionStore) {
  const mmodule = restController.getModelNameByTag('auth-module');

  let takInfo;
  let modules = permissionStore.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (adminModules && !adminModules.includes(m)) continue; //modules not managed by this app

    takInfo = "update admin modules " + m + " with resources: " + modules[m];
    await restController.ModelExecute(
            mmodule,
            "updateOne",
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        ).then(modelExecuteSuccess2(takInfo), modelExecuteError2(takInfo));
    let mModuleId;
    await restController.ModelExecute(
            mmodule,
            "findOne",
            {module: m}//search criteria
        ).then(function(result) {
            if (result) mModuleId = result['_id'];
          }, 
          modelExecuteError2(takInfo));

    roleModuleIds[m] = mModuleId;//cached id for later use
  }

  //get module ID for "All Modules"
  await restController.ModelExecute(
          mmodule,
          "findOne",
          {module: 'All Modules'}//search criteria
      ).then(function(result) {
          if (result) roleAllModuleId = result['_id'];
        }, 
        modelExecuteError2(takInfo));
}

const downloadRoleAndPermissionsLocal = async function(adminModules, restController, permissionStore) {
  const mpermission = restController.getModelNameByTag('auth-permission');

  let modules = permissionStore.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (adminModules && !adminModules.includes(m)) continue; //modules not managed by this app
    
    let mModuleId = roleModuleIds[m];
    if (mModuleId) {
      takInfo = `get "${m}" admin module permisions...`;
      await restController.ModelExecute2(
              mpermission,
              [
                ['find', [{module: mModuleId}]], //search criteria
                ['populate', ['role', 'role']], //return role name for the role reference.
                ['populate', ['module', 'module']] //return module name for the role reference.
              ]
          ).then(function(result) {
              if (result) {
                roleModulePermissions[m] = result;
              }
            }, 
            modelExecuteError2(takInfo));
    } else {
      console.warn(` --- Warning: auth app: admin module "${m}" not found in system.`);
    }
  }
  
  if (roleAllModuleId) {
    takInfo = `get "All Modules" admin module permisions...`;
    await restController.ModelExecute2(
            mpermission,
            [
              ['find', [{module: roleAllModuleId}]], //search criteria
              ['populate', ['role', 'role']], //return role name for the role reference.
              ['populate', ['module', 'module']] //return module name for the role reference.
            ]
        ).then(function(result) {
            if (result) {
              roleModulePermissions["All Modules"] = result;
            }
          }, 
          modelExecuteError2(takInfo));
  }
  permissionStore.setPermissions(roleModulePermissions);
}

module.exports = {
  uploadRoleModulesLocal,
  downloadRoleAndPermissionsLocal,
  uploadGroupsModulesAndAccessLocal,
  downloadGroupsAndAccessLocal,       
}