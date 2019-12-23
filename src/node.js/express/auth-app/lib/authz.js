const createError = require('http-errors');

/* example of authz rules:
  const authz = {
    "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": "N"}
    "schema1": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": "N"}
    "schema2": {"LoginUser": "R", "Anyone": "N"}
  }

  Two identity types: "LoginUser", "Anyone"
  Four operations: C, R, U, D
  Permissions: C, R, U, D, and N (No operations allowed).

  A: Permission Check
  1 Overral Check
    (1)
    LoginUser - undefined
    Anyone - undefined

    Not Permitted
  
    (2)
    LoginUser - undefined
    Anyone - Defined

    Use Anyone permission

    (3)
    LoginUser - Defined
    Anyone - undefined

    Anyone not permitted.

    (3)
    LoginUser - Defined
    Anyone - Defined

    See following #2 and #3

  2.  Module level vs. Schema level:
  - if schema level permission is defined for "LoginUser", check.
  - else, if module level permission is defined for "LoginUser", check.

  B: Permission String:
  ""  - no operation allowed
  not present, or undefined  - all permissions are allowed
  null  - same as ""

  C: Return 40x:
  if identity is "Anyone", return 401 (Unauthorized)
  if identity is "LoginUser", return 403 (Forbidden)

  Examples:
  1. 
  const authz = {
  }

  Anyone, Login User:
  Permission Undefined. Not Permitted.

  2.

  const authz = {
    "module-authz": {"LoginUser": "RW", "Anyone": ""}
  }

  (1)Anyone
  Check module level permission. "": Not Permitted.

  Result: Not Permitted

  (2)Login User
  Check module level permission. RW Permitted 

  Result: RW permitted.

  3.
  const authz = {
    "module-authz": {"LoginUser": "RW", "Anyone": "R"}
    "schema2": {"LoginUser": "RD", "Anyone": ""}
  }

  (1)Anyone
  Check schema level permission. "": Not Permitted.

  Result: Not Permitted

  (2)Login User
  Check schema level permission. RD Permitted.

  Result: RD permitted.

  4.
  const authz = {
    "module-authz": {"LoginUser": "RW", "Anyone": "RW"}
    "schema2": {"Anyone": "R"}
  }

  (1)Anyone
  Check schema level permission. "": Not Permitted.

  Result: Not Permitted

  (2)Login User
  Check module level permission. RW Permitted.

  Result: RW permitted.

  5.
  const authz = {
    "module-authz": {"Anyone": "R"}
    "schema2": {"Anyone": "W"}
  }

  (1)Anyone
  Check schema level permission. W Permitted.

  Result: W Permitted

  (2)Login User
  Check "Anyone" permission.

  Result: W permitted.

*/
const getSchemaPermission = function(perm, schemaName) {
  let resourcePermission = {};
  if (perm['resourcePermission'] instanceof Map) {
    //convert Map to object.
    for(let [key,val] of perm['resourcePermission'].entries()){
      resourcePermission[key]= val;
    }
    perm['resourcePermission'] = resourcePermission; //set back. So no conversion next time. Hopefully.
  } else if (typeof perm['resourcePermission'] == 'object') { //object
    resourcePermission = perm['resourcePermission'];
  }
  
  if (schemaName && resourcePermission[schemaName]) {
    //use the permission definition for the schema
    return resourcePermission[schemaName];
  } 
  
  if (perm['modulePermission']) {
    //use module permission
    return perm['modulePermission'];
  }
  return undefined;
}
const getPermission = function(permissions, permType, identity, schemaName, allModulePermissions) {
  //permType: role, group
  let mperm;
  if (!permissions) permissions = [];
  if (!allModulePermissions) allModulePermissions = [];
  
  for (let p of permissions) {
    if (!p[permType]) continue; //ignore bad permission
    if (p[permType][permType] == identity || p[permType]['_id'] == identity) {
      mperm = p;
      break;
    }
  }
  
  let permission;
  if (mperm) {
    permission = getSchemaPermission(mperm, schemaName)
  }
  
  if (permission) return permission;
  
  //if not defined in module permission, check the allModulue permission for this role
  let allperm;
  for (let p of allModulePermissions) {
    if (!p[permType]) continue; //ignore bad permission
    if (p[permType][permType] == identity || p[permType]['_id'] == identity) {
      allperm = p;
      break;
    }
  }
  
  let allpermission;
  if (allperm) {
    allpermission = getSchemaPermission(allperm, schemaName)
  }
  
  return allpermission; //undefined, or defined.
};

//Check restControllers for all supported operations
const getOperation = function(req) {
  let httpOperation = req.method;
  /*
  let action;
  if (req.query) {
    action = req.query['action'];
  }
  */
  let originalUrl = req.originalUrl;

  let operation;
  if (originalUrl.includes('/mddsaction/')) {
    if (originalUrl.includes('/mddsaction/get')) operation = 'R';
    else if (originalUrl.includes('/mddsaction/export')) operation = 'R';
    else if (originalUrl.includes('/mddsaction/emailing')) operation = 'R';

    else if (originalUrl.includes('/mddsaction/post')) operation = 'U';
    else if (originalUrl.includes('/mddsaction/delete')) operation = 'D';
    else if (originalUrl.includes('/mddsaction/archive')) operation = 'A';
    else if (originalUrl.includes('/mddsaction/put')) operation = 'C';
  }
  if (operation) return operation;
  
  if (httpOperation == "GET") operation = 'R';
  else if (httpOperation == "PUT") operation = 'C';
  else if (httpOperation == "DELETE") operation = 'D';
  else if (httpOperation == "POST") operation = 'U';
  
  return operation || "UNKOWN";
}


const verifyRolePermission = function(req, res, next) {
  let schemaName = req.meanRestSchemaName;
  //console.log("***schemaName", schemaName)  
  let operation = getOperation(req);
  
  let roles = req.muser.role; //[] list of role ids
  
  let roleDisallow = false;
  let mddsModulePermissions = req.mddsModulePermissions? req.mddsModulePermissions : [];
  let mddsAllModulePermissions = req.mddsAllModulePermissions? req.mddsAllModulePermissions : [];
  //console.log("***mddsModulePermissions", mddsModulePermissions)  
  //console.log("***mddsAllModulePermissions", mddsAllModulePermissions)
  for (let rId of roles) {
    //mddsPermission is set by restRouter before authorization (rest_router.js)
    let rolePermission = getPermission(mddsModulePermissions, 'role', rId, schemaName, mddsAllModulePermissions);
    
    if (rolePermission && rolePermission.includes(operation)) { //any role allows it
      return next();
    }
    if (rolePermission) roleDisallow = true; //disallowed by any least one row.
  }

  if (roleDisallow) {
    return next(createError(403, "Forbidden."));
  }
  
  let loginPermission = getPermission(mddsModulePermissions, 'role', "LoginUser", schemaName, mddsAllModulePermissions);

  if (loginPermission && loginPermission.includes(operation)) {
    return next(); //allowed by allModulePermission
  }

  return next(createError(403, "Forbidden."));
}


const verifyPermission = function(req, res, next) {
  const loggedIn = !!req.muser
  // console.log("***req.muser", req.muser)
  // console.log("***req.mddsModuleAccesses - public access\n", req.mddsModuleAccesses)
  // console.log("***req.mddsModulePermissions - role access\n", req.mddsModulePermissions)

  if (loggedIn && req.muser.role && req.muser.role.length > 0) {
    return verifyRolePermission(req, res, next); //use role based permission
  } 
  
  let schemaName = req.meanRestSchemaName;
  let operation = getOperation(req);
  
  //mddsPermission is set by restRouter before authorization (rest_router.js)
  let mddsModuleAccesses = req.mddsModuleAccesses? req.mddsModuleAccesses : [];
  let mddsAllModuleAccesses = req.mddsAllModuleAccesses? req.mddsAllModuleAccesses : [];
  let anyonePermission = getPermission(mddsModuleAccesses, 'group', 'Anyone', schemaName, mddsAllModuleAccesses);
  let loginOwnPermission = getPermission(mddsModuleAccesses, 'group', "LoginUserOwn", schemaName, mddsAllModuleAccesses);
  let loginOthersPermission = getPermission(mddsModuleAccesses, 'group', "LoginUserOthers", schemaName, mddsAllModuleAccesses);
  
  let permission = "N";

  if (typeof anyonePermission === 'undefined' &&
          typeof loginOwnPermission == 'undefined' &&
          typeof loginOthersPermission === 'undefined') { //[0, 0, 0]
    //not permitted
    permission = "N";
  } else if (typeof loginOwnPermission == 'undefined' &&
          typeof loginOthersPermission === 'undefined') { //only anyone defined [1, 0, 0]
    permission = anyonePermission;
  } else if (typeof anyonePermission == 'undefined') { // any one undefined, one of login permissions defined. [0, 1, 0], [0, 1, 0], [0, 1, 1]
    if (loggedIn) { permission = loginOthersPermission ? loginOthersPermission : 'N';}
    else permission = "N"; //not permitted
  } else { //anyone defined, and one of login defined [1, 1, 0], [1, 0, 1], [1, 1, 1] 
    if (loggedIn) { permission = loginOthersPermission ? loginOthersPermission : 'N';}
    else permission = anyonePermission;
  }

  if (permission.includes(operation)) {
    return next();
  } 
  
  if (!loggedIn) {
    return next(createError(401, "Not Authorized.")); //ask for login
  }

  //check if need own resource resolution
  if ( !loginOwnPermission || !loginOwnPermission.includes(operation)) {
    return next(createError(403, "Forbidden."));
  } 
  
  req.loginOwnPermission = loginOwnPermission;
  req.permissionOperation = operation;
  return next();  //have to be resolved in controller based on the owner of record
}

const permissionStore = require('./permission.store');
const setModulePermission = function(req, res, next) {
  const moduleName = req.mddsModuleName;
  req.mddsModulePermissions = permissionStore.getPermission(moduleName);
  req.mddsAllModulePermissions = permissionStore.getPermission("All Modules");
  req.mddsModuleAccesses = permissionStore.getAccess(moduleName);
  req.mddsAllModuleAccesses = permissionStore.getAccess("All Modules");
  next();
}

module.exports = { verifyPermission: verifyPermission, setModulePermission: setModulePermission};

