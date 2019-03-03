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

const getPermission = function(permissions, identity, schemaName) {
  let perm;
  for (let p of permissions) {
    if (!p.role) continue; //ignore bad permission
    if (p.role.role == identity || p.role['_id'] == identity) {
      perm = p;
      break;
    }
  }
  if (!perm) return undefined; //not defined
  
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
  
  if (resourcePermission[schemaName]) {
    //use the permission definition for the schema
    return resourcePermission[schemaName];
  } 
  
  if (perm['modulePermission']) {
    //use module permission
    return perm['modulePermission'];
  }
  return undefined;
}

const verifyPermission = function(req, res, next) {
  const loggedIn = !!req.muser
  
  if (loggedIn && req.muser.role) {
    return next();  //now allow any role
  } 
  
  let schemaName = req.meanRestSchemaName;

  let httpOperation = req.method;
  let action;
  if (req.query) {
    action = req.query['action'];
  }

  let operation = "UNKNOWN";
  if (httpOperation == "GET" && action == 'edit') operation = 'U';  //get for edit
  else if (httpOperation == "GET") operation = 'R';
  else if (httpOperation == "PUT") operation = 'C';
  else if (httpOperation == "DELETE") operation = 'D';
  else if (httpOperation == "POST") {
    //see RestController.PostActions
    if (action && action == "DeleteManyByIds") operation = 'D';
    else if (action && action == "Search") operation = 'R';
    else operation = 'U';
  }
  //mddsPermission is set by restRouter before authorization (rest_router.js)
  let mddsModulePermissions = req.mddsPermission? req.mddsPermission : [];
  let mddsAllModulePermissions = [];
  let anyonePermission = getPermission(mddsModulePermissions, 'Anyone', schemaName, mddsAllModulePermissions);
  let loginOwnPermission = getPermission(mddsModulePermissions, "LoginUserOwn", schemaName, mddsAllModulePermissions);
  let loginOthersPermission = getPermission(mddsModulePermissions, "LoginUserOthers", schemaName, mddsAllModulePermissions);
  
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
  
  if (req.muser.role) {
    for (let r of role) {
      let rolePermission = getPermission(mddsModulePermissions, r, schemaName, mddsAllModulePermissions);
      if (rolePermission) {
        if (rolePermission.includes(operation)) return next();  //any role permits the operation
      }
    }
  }

  //check if need own resource resolution
  if ( !loginOthersPermission || !loginOthersPermission.includes(operation)) {
    return next(createError(403, "Forbidden."));
  } 
  
  req.loginOwnPermission = loginOwnPermission;
  req.permissionOperation = operation;
  return next();  //have to be resolved in controller based on the owner of record
}

module.exports = verifyPermission;

