const createError = require('http-errors');

/* example of authz rules:
  const authz = {
    "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
    "schema1": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
    "schema2": {"LoginUser": "R", "Anyone": ""}
  }

  Two identity types: "LoginUser", "Anyone"
  Four operations: C, R, U, D

  A: Permission Check
  1 Overral Check
    (1)
    LoginUser - undefined
    Anyone - undefined

    Permitted
  
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

  (1)Anyone
  Undefined. Permitted.

  (2)Login User
  Undefined. Permitted.

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

const getLoginUserPermission = function(permission) {
  let othersPermisson = permission['others'];
  if (typeof othersPermission !== 'string') {
    othersPermission = ''; //not permitted
  }
  let ownPermisson = permission['own'];
  if (typeof ownPermisson !== 'string') {
    ownPermisson = ''; //not permitted
  }
  return {"others": othersPermission, "own": ownPermisson}
}

const getPermission = function(authz, identity, schemaName) {
  let schemaAuthz; 
  if (schemaName in authz) {
    //use the permission definition for the schema
    schemaAuthz = authz[schemaName];
  } 
  let moduleAuthz; 
  if ("module-authz" in authz) {
    //use the permission definition for the module
    moduleAuthz = authz["module-authz"];
  }
  
  let identityPermission;
  if (schemaAuthz && identity in schemaAuthz) {
    identityPermission = schemaAuthz[identity];
  } else if (moduleAuthz && identity in moduleAuthz) {
    identityPermission = moduleAuthz[identity];
  }

  if (identity == "Anyone") {
    if (typeof identityPermission === 'string' || typeof identityPermission === 'undefined') {
      return identityPermission;
    } else {
      return ""; //not permitted
    }
  } else if (identity == "LoginUser") {
    if (typeof identityPermission === 'string' || typeof identityPermission === 'undefined') {
      return {"others": identityPermission, "own": identityPermission};
    } else if (typeof identityPermission === 'object') {
      return getLoginUserPermission(identityPermission); 
    } else {
      return {"others": '', "own": ''}; //not permitted
    }
  }
  return identityPermission;
}

const verifyPermissionFuncCreator = function(schemaName, authz) {
  const verifyPermission = function(req, res, next) {
    let httpOperation = req.method
    let action;
	for (let prop in req.query) {
		if (prop === "action") action = req.query[prop];
	}

    let operation = "UNKNOWN";
    if (httpOperation == "GET") operation = 'R';
    else if (httpOperation == "PUT") operation = 'C';
    else if (httpOperation == "DELETE") operation = 'D';
    else if (httpOperation == "POST") {
      //see RestController.PostActions
      if (action && action == "DeleteManyByIds") operation = 'D';
      else if (action && action == "Search") operation = 'R';
      else operation = 'U';
    }

    let anyonePermission = getPermission(authz, 'Anyone', schemaName);
    let loginPermission = getPermission(authz, "LoginUser", schemaName);

    const loggedIn = !!req.muser
    let permission = "";

    if (typeof anyonePermission === 'undefined' &&
            typeof loginPermission.others == 'undefined' &&
            typeof loginPermission.own === 'undefined') {
      //permitted
      permission = "CURD";
    } else if (typeof loginPermission.others == 'undefined' &&
            typeof loginPermission.own === 'undefined') {
      permission = anyonePermission;
    } else if (typeof anyonePermission == 'undefined') {
      if (loggedIn) { permission = loginPermission;}
      else permission = ""; //not permitted
    } else {
      if (loggedIn) { permission = loginPermission;}
      else permission = anyonePermission;
    }

    let permitted = false;
    if (typeof permission === 'string' && permission.includes(operation)) {
      permitted = true;
    } else if (typeof permission === 'string') {
      permitted = false;
    } else {
      //permission object for logged in user.
      if (permission.others.includes(operation) && permission.own.includes(operation)) {
        permitted = true;
      } else if (!permission.others.includes(operation) && !permission.own.includes(operation)) {
        permitted = false;
      } else {
        req.loginPermission = permission;
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
  
  return verifyPermission
}

module.exports = verifyPermissionFuncCreator;

