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
    if (p.role.role == identity) {
      perm = p;
      break;
    }
  }
  if (!perm) return undefined; //not defined
  
  if (perm['resourcePermission'][schemaName]) {
    //use the permission definition for the schema
    return perm['resourcePermission'][schemaName];
  } 
  if (perm['modulePermission']) {
    //use module permission
    return perm['modulePermission'];
  }
  return undefined;
}

const verifyPermission = function(req, res, next) {
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
  let mddsPermissions = req.mddsPermission? req.mddsPermission : [];
  let anyonePermission = getPermission(mddsPermissions, 'Anyone', schemaName);
  let loginOwnPermission = getPermission(mddsPermissions, "LoginUserOwn", schemaName);
  let loginOthersPermission = getPermission(mddsPermissions, "LoginUserOthers", schemaName);
  
  const loggedIn = !!req.muser
  let permission = "N";

  if (typeof anyonePermission === 'undefined' &&
          typeof loginOwnPermission == 'undefined' &&
          typeof loginOthersPermission === 'undefined') {
    //not permitted
    permission = "N";
  } else if (typeof loginOwnPermission == 'undefined' &&
          typeof loginOthersPermission === 'undefined') {
    permission = anyonePermission;
  } else if (typeof anyonePermission == 'undefined') {
    if (loggedIn) { permission = loginOthersPermission;}
    else permission = "N"; //not permitted
  } else {
    if (loggedIn) { permission = loginOthersPermission;}
    else permission = anyonePermission;
  }

  let permitted = false;
  if (permission.includes(operation)) {
    permitted = true;
  } else if (loggedIn) {
    if (typeof loginOthersPermission == 'undefined' || !loginOthersPermission.includes(operation)) {
      permitted = false;
    } else {
      req.loginOwnPermission = loginOwnPermission;
      req.permissionOperation = operation;
      return next();  //have to be resolved in controller based on the owner of record
    }
  }

  let role;
  if (req.muser) role = req.muser.role;

  if (permitted) {
    return next();
  } else {
    if (!loggedIn) {
      return next(createError(401, "Not Authorized.")); //ask for login
    }
    return next(createError(403, "Forbidden.")); 
  }
}

module.exports = verifyPermission;

