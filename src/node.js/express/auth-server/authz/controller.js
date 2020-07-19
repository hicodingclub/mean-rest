const meanRestExpress = require('@hicoder/express-core')

const AuthzController = function() {
}

function getUserRole(restController, userId) {
  const muserrole = restController.getModelNameByTag('auth-user-role');
  
  // a promise
  return restController.ModelExecute(
    muserrole,
    'findOne',
    {account: userId} //search criteria
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

AuthzController.getAccountRoles = function(restController) {
  function func(req, res, next) {
    if (!req.muser) {
      let err = new Error("Authorization: User not available for getting roles.");
      return next(err);
    }
    let userId = req.muser['_id'];
    if (!userId) return next(); //without setting roles. User becomes normal login user.
    getUserRole(restController, userId).then(result => {
      let role = [];
      if (result) {
        role = result.role;
      }
      let permissions = {};
      getRolePermissions(restController, role).then(results => {
        for (let p of results) {
          let m = p.module.module; // module name
          let mp = p.modulePermission || '';
          let mr = p.resourcePermission || {};
          permissions[m] = {
            mp,
            mr,
          };
        }
        req.muser.role = role;
        req.muser.rolep = permissions;
        return next();
      }).catch(err => {
        req.muser.role = role;
        req.muser.rolep = permissions;
        return next();
      });
    }).catch(err => {
      return next(err);
    });
  }
  return func;
};

module.exports = AuthzController;
