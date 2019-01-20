const createError = require('http-errors');

const verifyPermissionFuncCreator = function(schemaName, authz) {
  /* example of authz
  const authz = {
    "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
    "schema1": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
    "schema2": {"LoginUser": "R", "Anyone": ""}
  }
  */
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

    let identity = "Anyone";
    if (req.muser) identity = "LoginUser";
    let role;
    if (req.muser) role = req.muser.role;

    let schemaAuthz; 
    if (schemaName in authz) {
      //use the permission definition for the schema
      schemaAuthz = authz[schemaName];
    } else {
      //use the permission definition for the module
      schemaAuthz = authz["module-authz"];
    }

    let identityPermission = "";
    if (schemaAuthz && schemaAuthz[identity]) {
      identityPermission = schemaAuthz[identity];
      if (identity == "LoginUser" && typeof identityPermission == 'object') {
        //eg: "LoginUser": {"others": "", "own": "RU"}
        req.identityPermission = identityPermission;
        return next();  //have to be resolved in controller based on the owner of record
      }
    }
    if (typeof identityPermission == 'string') {
      //eg: "LoginUser": "CRUD",  "Anyone": "R"
      if (!identityPermission.includes(operation)) {
        if (identity == "Anyone") {
          return next(createError(401, "Not Authorized.")); //ask for login
        }

        return next(createError(403, "Forbidden.")); //logined user.
      }
    }
    return next();
  }
  
  return verifyPermission
}

module.exports = verifyPermissionFuncCreator;

