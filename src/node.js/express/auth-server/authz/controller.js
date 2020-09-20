const meanRestExpress = require('@hicoder/express-core')

const AuthzController = function() {
}

function getUserRoles(restController, userId) {
  const muserrole = restController.getModelNameByTag('auth-user-role');
  
  // a promise
  return restController.ModelExecute(
    muserrole,
    'findOne', // fine one user
    {account: userId} //search criteria
  );
}

function getLoginUserRole(restController) {
  const mrole = restController.getModelNameByTag('auth-role');

  // a promise
  return restController.ModelExecute(
    mrole,
    'findOne', // fine one user
    {role: 'LoginUser'} //search criteria
  );
}

function getRolePermissions(restController, roles) {
  const mpermission = restController.getModelNameByTag('auth-permission');

  return restController.ModelExecute2(
    mpermission,
    [
      ['find', [{role: {$in: roles}}]], //search criteria
      ['populate', ['role', 'role']], //return role name for the role reference.
      ['populate', ['module', 'module']] //return module name for the role reference.
    ]
  );
}

function mergePermissions(permResults, permissions) {
  for (let p of permResults) {
    let m = p.module.module; // module name
    let mp = p.modulePermission || '';
    let mr = p.resourcePermission || {};

    // merge m with existing m permissions from other roles
    permissions[m] = permissions[m] || { mp: '', mr: {}};
    permissions[m].mp += mp;
    for (let [key, value] of mr) {
      if (permissions[m].mr[key]) {
        permissions[m].mr[key] += value;
      } else {
        permissions[m].mr[key] = value;
      }
    }
  }
  return permissions;
}

AuthzController.getAccountRoles = function(restController) {
  function func(req, res, next) {
    if (!req.muser) {
      let err = new Error("Authorization: User not available for getting roles.");
      return next(err);
    }
    let userId = req.muser['_id'];
    if (!userId) return next(); //without setting roles. User becomes normal login user.
    getUserRoles(restController, userId).then(async (result) => {
      let role = [];
      if (result) {
        role = result.role;
      }
      let permissions = {};
      try {
        let results = await getRolePermissions(restController, role);
        permissions = mergePermissions(results, permissions);

        // Also get the login user role permissions
        let loginUserRole = await getLoginUserRole(restController);
        let loginUserRolePerm = await getRolePermissions(restController, [loginUserRole._id]);
        permissions = mergePermissions(loginUserRolePerm, permissions);

        req.muser.role = role;
        req.muser.rolep = permissions;
        return next();
      } catch(err) {
        req.muser.role = role;
        req.muser.rolep = permissions;
        return next();
      }
    }).catch(err => {
      return next(err);
    });
  }
  return func;
};

module.exports = AuthzController;
