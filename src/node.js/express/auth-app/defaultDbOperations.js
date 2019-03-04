const meanRestExpress = require('mean-rest-express')
const restController = meanRestExpress.restController;

const publicModuleIds = {};

const adminModuleIds = {};
let adminAllModuleId;

const userGroupIds = {};
const publicModuleAccess = {};
const adminModulePermissions = {};

function modelExecuteSuccess1(taskStr) {
  function doSomething(result) {
    console.log(" --- auth app (public access): model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError1(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- auth app (public access): model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- auth app (public access): model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- auth app (public access): model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}

const uploadPublicModulesAndAccessLocal = async function(publicModules) {
  let takInfo;
  let anyoneRoleId, loginUserOwnId, loginUserOthersId;
  let roleArr = ['Anyone', 'LoginUserOwn', 'LoginUserOthers'];
  for (let ar of roleArr) {
    takInfo = `get "${ar}" user group infomation...`;
    let rId;
    await restController.ModelExecute(
            "musergroup",
            "findOne",
            {group: ar}//search criteria
        ).then(function(result) {
            if (result) rId = result['_id'];
          }, 
          modelExecuteError1(takInfo));
    userGroupIds[ar] = rId;
  }
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (publicModules && !publicModules.includes(m)) continue; //modules not managed by this app
    
    takInfo = "update public modules " + m + " with resources: " + modules[m];
    await restController.ModelExecute(
            "mpubmodule",
            "updateOne",
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        ).then(modelExecuteSuccess1(takInfo), modelExecuteError1(takInfo));
    takInfo = `get "${m}" public module infomation...`;
    let mModuleId;
    await restController.ModelExecute(
            "mpubmodule",
            "findOne",
            {module: m}//search criteria
        ).then(function(result) {
            if (result) mModuleId = result['_id'];
          }, 
          modelExecuteError1(takInfo));
    
    publicModuleIds[m] = mModuleId;//cached id for later use
    
    let authz = restController.getAccess(m);
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
                "mpubaccess",
                "create",
                doc //document
            ).then(modelExecuteSuccess1(takInfo), modelExecuteError1(takInfo));
      }    
    }
  }
  //get module ID for "All Modules"
  await restController.ModelExecute(
          "mpubmodule",
          "findOne",
          {module: 'All Modules'}//search criteria
      ).then(function(result) {
          if (result) publicAllModuleId = result['_id'];
        }, 
        modelExecuteError1(takInfo));
}

const downloadPublicGroupsAndAccessLocal = async function(publicModules) {
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (publicModules && !publicModules.includes(m)) continue; //modules not managed by this app

    let mModuleId = publicModuleIds[m];
    if (mModuleId) {
      takInfo = `get "${m}" public module permisions...`;
      await restController.ModelExecute2(
              "mpubaccess",
              [
                ['find', [{module: mModuleId}]], //search criteria
                ['populate', ['group', 'group']], //return role name for the role reference.
                ['populate', ['module', 'module']] //return module name for the role reference.
              ]
          ).then(function(result) {
              if (result) {
                publicModuleAccess[m] = result;
              }
            }, 
            modelExecuteError1(takInfo));
    } else {
      console.warn(` --- Warning: auth app: public module "${m}" not found in system.`);
    }
  }

  if (publicAllModuleId) {
    takInfo = `get "All Modules" public module permisions...`;
    await restController.ModelExecute2(
            "mpubaccess",
            [
              ['find', [{module: publicAllModuleId}]], //search criteria
              ['populate', ['group', 'group']], //return role name for the role reference.
              ['populate', ['module', 'module']] //return module name for the role reference.
            ]
        ).then(function(result) {
            if (result) {
              publicModuleAccess["All Modules"] = result;
            }
          }, 
          modelExecuteError1(takInfo));
  }
  restController.setAccesses(publicModuleAccess);
}

function modelExecuteSuccess2(taskStr) {
  function doSomething(result) {
    console.log(" --- auth app (admin roles): model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError2(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- auth app (admin roles): model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- auth app (admin roles): model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- auth app (admin roles): model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}

const uploadAdminModulesLocal = async function(adminModules) {
  let takInfo;

  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (adminModules && !adminModules.includes(m)) continue; //modules not managed by this app
    
    takInfo = "update admin modules " + m + " with resources: " + modules[m];
    await restController.ModelExecute(
            "mmodule",
            "updateOne",
            {module: m}, //search criteria
            {module: m, resources: modules[m]}, //document
            {upsert: true, setDefaultsOnInsert: true} //options update or insert
        ).then(modelExecuteSuccess2(takInfo), modelExecuteError2(takInfo));
    let mModuleId;
    await restController.ModelExecute(
            "mmodule",
            "findOne",
            {module: m}//search criteria
        ).then(function(result) {
            if (result) mModuleId = result['_id'];
          }, 
          modelExecuteError2(takInfo));
    
    adminModuleIds[m] = mModuleId;//cached id for later use
  }
  
  //get module ID for "All Modules"
  await restController.ModelExecute(
          "mmodule",
          "findOne",
          {module: 'All Modules'}//search criteria
      ).then(function(result) {
          if (result) adminAllModuleId = result['_id'];
        }, 
        modelExecuteError2(takInfo));
}

const downloadAdminRoleAndPermissionsLocal = async function(adminModules) {
  let modules = restController.getAllModules();
  for (let m in modules) { //{'moduleName': [resource1, resource2...]}
    if (adminModules && !adminModules.includes(m)) continue; //modules not managed by this app
    
    let mModuleId = adminModuleIds[m];
    if (mModuleId) {
      takInfo = `get "${m}" admin module permisions...`;
      await restController.ModelExecute2(
              "mpermission",
              [
                ['find', [{module: mModuleId}]], //search criteria
                ['populate', ['role', 'role']], //return role name for the role reference.
                ['populate', ['module', 'module']] //return module name for the role reference.
              ]
          ).then(function(result) {
              if (result) {
                adminModulePermissions[m] = result;
              }
            }, 
            modelExecuteError2(takInfo));
    } else {
      console.warn(` --- Warning: auth app: admin module "${m}" not found in system.`);
    }
  }
  
  if (adminAllModuleId) {
    takInfo = `get "All Modules" admin module permisions...`;
    await restController.ModelExecute2(
            "mpermission",
            [
              ['find', [{module: adminAllModuleId}]], //search criteria
              ['populate', ['role', 'role']], //return role name for the role reference.
              ['populate', ['module', 'module']] //return module name for the role reference.
            ]
        ).then(function(result) {
            if (result) {
              adminModulePermissions["All Modules"] = result;
            }
          }, 
          modelExecuteError2(takInfo));
  }
  restController.setPermissions(adminModulePermissions);
}

module.exports = {
        uploadAdminModulesLocal: uploadAdminModulesLocal,
        downloadAdminRoleAndPermissionsLocal: downloadAdminRoleAndPermissionsLocal,
        uploadPublicModulesAndAccessLocal: uploadPublicModulesAndAccessLocal,
        downloadPublicGroupsAndAccessLocal: downloadPublicGroupsAndAccessLocal,       
      }