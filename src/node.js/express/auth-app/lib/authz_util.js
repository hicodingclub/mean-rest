const getAuthzByIdentity = function(identity, authz) {
  //identity: "Anyone", "LoginUserOwn", "LoginUserOthers"
    /* authz = {
          "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
          "schema1": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
          "schema2": {"LoginUser": "R", "Anyone": ""}
        }
    */
  function getLoginUserAuthz(key, authObj) {
    if (typeof authObj == 'string') {
      if (key == 'own') { //same for 'own' and 'others'. let 'others' take effect
        return undefined;
      } else {
        return authObj;
      }
    }
    else if (typeof authObj == 'object') return authObj[key];
    return undefined;
  }
  let az = {
      'group': {'group': identity},
      'modulePermission': undefined,
      'resourcePermission': {}
  };
  if (!authz) {
    return az; //all undefined
  }
  
  let moduleAuthz = authz['module-authz'];
  let copyAuthz = {};
  for (let p in authz) {
    if (p != 'module-authz') copyAuthz[p] = authz[p];
  }

  switch (identity) {
  case "Anyone":
    az['modulePermission'] = moduleAuthz['Anyone'];
    for (let schema in copyAuthz) {
      az['resourcePermission'][schema] = copyAuthz[schema]['Anyone'];
    }
    break;
  case "LoginUserOwn":
    az['modulePermission'] = getLoginUserAuthz('own', moduleAuthz['LoginUser']);
    for (let schema in copyAuthz) {
      az['resourcePermission'][schema] = getLoginUserAuthz('own', copyAuthz[schema]['LoginUser']);
    }
    break;
  case "LoginUserOthers":
    az['modulePermission'] = getLoginUserAuthz('others', moduleAuthz['LoginUser']);
    for (let schema in copyAuthz) {
      az['resourcePermission'][schema] = getLoginUserAuthz('others', copyAuthz[schema]['LoginUser']);
    }
    break;
  }
  return az;
}

const getPermissionFromAuthz = function(authz) {
  return [
    getAuthzByIdentity('Anyone', authz),
    getAuthzByIdentity('LoginUserOwn', authz),
    getAuthzByIdentity('LoginUserOthers', authz)
  ];
}

module.exports = getPermissionFromAuthz;
