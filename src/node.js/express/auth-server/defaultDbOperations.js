// DB Population
const populateRoles = function(restController, interface) {
  function modelExecuteSuccess(taskStr) {
    function doSomething(result) {
      console.log(" --- auth server (role access): model excecute succeeded: ", taskStr);
    }
    return doSomething;
  }
  function modelExecuteError(taskStr) {
    function doSomething(err) {
      if (err.code === 11000) console.log(" --- auth server (role access): model excecute already exist: ", taskStr);
      else if (err.errmsg) console.warn(" --- auth server (role access): model excecute failed: ", taskStr, err.errmsg);
      else console.warn(" --- auth server (role access): model excecute failed: ", taskStr, err.message);
    }
    return doSomething;
  }
  
  async function runDB() {
    let taskInfo;
    const mrole = restController.getModelNameByTag('auth-role');
    const mmodule = restController.getModelNameByTag('auth-module');
    const mpermission = restController.getModelNameByTag('auth-permission');
    const muser = restController.getModelNameByTag('auth-user');
    const muserrole = restController.getModelNameByTag('auth-user-role');
    //pre-configured data:
    //admin user:
    //1. "Administrator" user role
    //2. "All Modules" system module
    //3. "Administrator" role permission to "All Modules"
    //4. "admin" user
    //5. "admin" user with "Administrator" role.
    
    takInfo = 'create "Administrator" role with full permissions...';
    await restController.ModelExecute(
            mrole,
            "create",
            {role: 'Administrator', description: 'Administrator roles with full permissions.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));

    takInfo = 'insert system modules "All Modules" ...';
    await restController.ModelExecute(
            mmodule,
            "create",
            {module: "All Modules", resources: "All resources in the system."} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    
    takInfo = 'get "Administrator" role infomation...';
    let adminRoleId;
    await restController.ModelExecute(
            mrole,
            "findOne",
            {role: 'Administrator'}//search criteria
        ).then(function(result) {
            if (result) adminRoleId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    takInfo = 'get "All Modules" module infomation...';
    let allModuleId;
    await restController.ModelExecute(
            mmodule,
            "findOne",
            {module: "All Modules"}//search criteria
        ).then(function(result) {
            if (result) allModuleId = result['_id'];
          }, 
          modelExecuteError(takInfo));
    if (adminRoleId && allModuleId) {
      takInfo = 'insert permission for "Administrator" role for "All Modules"...';
      restController.ModelExecute(
              mpermission,
              "create",
              //{role: adminRoleId, module: allModuleId}, //search criteria
              {role: adminRoleId, module: allModuleId, modulePermission: "CRUDA"}//document
          ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    }
    if (interface === 'admin') {
      takInfo = 'create "admin" account with initial password "adminPassword"...';
      await restController.ModelExecute(
              muser,
              "create",
              {username: 'admin', password: 'adminPassword'} //document
          ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
      let adminUserId;
      takInfo = 'get "admin" account information...';
      await restController.ModelExecute(
              muser,
              "findOne",
              {username: "admin"}//search criteria
          ).then(function(result) {
              if (result) adminUserId = result['_id'];
            }, 
            modelExecuteError(takInfo));
      if (adminRoleId && adminUserId) {
        takInfo = 'insert "admin" account with "Administrator" role...';
        restController.ModelExecute(
                muserrole,
                "create",
                {account: adminUserId, role: [adminRoleId] } //document
            ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
      }  
    }

    takInfo = 'create "LoginUser" role ...';
    await restController.ModelExecute(
            mrole,
            "create",
            {role: 'LoginUser', description: 'Login users, if not assigned any roles.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));

    takInfo = 'create "Anyone" role ...';
    await restController.ModelExecute(
            mrole,
            "create",
            {role: 'Anyone', description: 'Any one, login or not.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
  }
  
  runDB();
};

const populatePublicAccess = function(restController) {
  function modelExecuteSuccess(taskStr) {
    function doSomething(result) {
      console.log(" --- auth server (group access): model excecute succeeded: ", taskStr);
    }
    return doSomething;
  }
  function modelExecuteError(taskStr) {
    function doSomething(err) {
      if (err.code === 11000) console.log(" --- auth server (group access): model excecute already exist: ", taskStr);
      else if (err.errmsg) console.warn(" --- auth server (group access): model excecute failed: ", taskStr, err.errmsg);
      else console.warn(" --- auth server (group access): model excecute failed: ", taskStr, err.message);
    }
    return doSomething;
  }
  
  async function runDB() {
    let taskInfo;

    const mgroup = restController.getModelNameByTag('auth-group');
    const mmodule = restController.getModelNameByTag('auth-module');

    //Other user roles:
    //1. "Anyone" user role
    //2. "LoginUserOwn" user role
    //3. "LoginUserOthers" user role    
    takInfo = 'create "Anyone" role ...';
    await restController.ModelExecute(
            mgroup,
            "create",
            {group: 'Anyone', description: 'Any one, login or not.'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    takInfo = 'create "LoginUserOwn" role ...';
    await restController.ModelExecute(
            mgroup,
            "create",
            {group: 'LoginUserOwn', description: 'Any login user, when trying to manage its own resource'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    takInfo = 'create "LoginUserOthers" role ...';
    await restController.ModelExecute(
            mgroup,
            "create",
            {group: 'LoginUserOthers', description: 'Any login user, when trying to manage other user\'s resource'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));

    takInfo = 'insert public modules "All Modules" ...';
    await restController.ModelExecute(
            mmodule,
            "create",
            {module: "All Modules", resources: "All resources in the system."} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
    
  }
  
  runDB();
};

module.exports = {
  populatePublicAccess,
  populateRoles,
};