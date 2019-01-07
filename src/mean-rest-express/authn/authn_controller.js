const jwt = require('jsonwebtoken');
var createError = require('http-errors');

const RestController = require('../lib/mean_rest_express_controller')
const loadContextVarsByName = RestController.loadContextVarsByName

var auth = {}
var AuthnController = function() {
  ;
}

AuthnController.registerAuth = function(schemaName, userFields, passwordField) {
  auth.schemaName = schemaName;
  auth.userFields = userFields;
  auth.passwordField = passwordField;
}

AuthnController.authLogin = function(req, res, next) {
  let {name: name, schema: schema, model: model, views: views} = loadContextVarsByName(auth.schemaName.toLowerCase());
  
  let body = req.body;
  if (typeof body === "string") {
      try {
          body = JSON.parse(body);
      } catch(e) {
        return next(createError(400, "Bad request body."));
      }
  }
  if (!body || typeof body !== "object") return next(createError(400, "Bad request body."));

  
  let userName;
  let fieldName;
  let userNames = auth.userFields.split(' ');
  for (let n of userNames) {
    if (body[n]) {
      fieldName = n;
      userName = body[n];
      break;
    }
  }
  
  let password;
  if (body[auth.passwordField]) {
      password = body[auth.passwordField];
  }

  if (!userName || !password) {
    return next(createError(400, "Bad login request: missing info."));
  }

  let query = {};
  query[fieldName] = userName;
  model.findOne(query, function(err, user) {
    if (err) {
      return next(err); 
    }
    if (!user) {
      return next(createError(403, "Bad login request: User Name"));
    }
    // test a matching password
    user.comparePassword(password, function(err, isMatch) {
        if (err || !isMatch) return next(createError(403, "Bad login request: Password."));
        req.muser = {"_id": user["_id"], 
          "userName": userName,
          "fieldName": fieldName
        };
        return next(); //don't send response. need generate Token.
    });
  });
}

AuthnController.generateToken = function(req, res, next) {
  let accessToken = jwt.sign(
    req.muser, 
    'server secret random', 
    {expiresIn: 60*60}
  );

  let refreshToken = jwt.sign(
    req.muser, 
    'server refresh secret random', 
    {expiresIn: 60*60*12}
  );

  let r = {
    "accessToken": accessToken,
    "refreshToken": refreshToken,
    "userName": req.muser.userName,
    "fieldName": req.muser.fieldName
  }
  return res.send(r);
}

AuthnController.verifyRefreshToken = function(req, res, next) {
  let {name: name, schema: schema, model: model, views: views} = loadContextVarsByName(auth.schemaName.toLowerCase());
  
  let body = req.body;
  if (typeof body === "string") {
      try {
          body = JSON.parse(body);
      } catch(e) {
        return next(createError(400, "Bad request body."));
      }
  }

  if (!body || typeof body !== "object") return next(createError(400, "Bad request body."));

  let token;
  let queryKey = "refreshToken";
  if (body[queryKey]) {
      token = body[queryKey];
  }

  if (!token) {
    return next(createError(400, "Bad request token."));
  }

  jwt.verify(token, 'server refresh secret random', function(err, decoded) {
    if (err) {
      //return next();
      return next(createError(400, "Bad request token."));
    }
    if (!decoded) return next(createError(400, "Bad request token."));
    req.muser = decoded;
    return next(); //call authRefresh to check user in DB.
  });  
}

AuthnController.authRefresh = function(req, res, next) {
  let {name: name, schema: schema, model: model, views: views} = loadContextVarsByName(auth.schemaName.toLowerCase());
  
  let { _id, userName, fieldName} = req.muser;
  let query = {};
  query["_id"] = _id;
  model.findOne(query, function(err, user) {
    if (err) {
      return next(err); 
    }
    if (!user) {
      return next(createError(403, "Bad user."));
    }
    req.muser = {"_id": user["_id"], 
          "userName": userName,
          "fieldName": fieldName
        };
    return next(); //don't send response. need generate Token.
  });
}

AuthnController.verifyToken = function(req, res, next) {
  let token;
  let queryKey = "accessToken";
  if (req.query && req.query[queryKey]) {
      token = req.query[queryKey];
  }

  if (!token && req.headers && req.headers.authorization) {
    var parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
  } 
  
  if (!token) {
    return next(createError(401, "Unauthorized."));
  }

  jwt.verify(token, 'server secret random', function(err, decoded) {
    if (err) {
      //return next();
      return next(createError(401, "Unauthorized."));
    }
    if (!decoded) return next(createError(401, "Unauthorized."));
    req.muser = decoded;
    return next();
  });
}

AuthnController.authRegister = function(req, res, next) {
  let {name: name, schema: schema, model: model, views: views} = loadContextVarsByName(auth.schemaName.toLowerCase());
  
  let body = req.body;
  if (typeof body === "string") {
      try {
          body = JSON.parse(body);
      } catch(e) {
        return next(createError(400, "Bad request body."));
      }
  }
  
  let userNameGiven = false;
  let userNames = auth.userFields.split(' ');
  for (let n of userNames) {
    if (body[n]) {
      userNameGiven = true;
      break;
    };
  }

  let password;
  if (body[auth.passwordField]) {
      password = body[auth.passwordField];
  }

  if (!userNameGiven || !password) {
    return next(createError(400, "Bad register request: missing info."));
  }

  model.create(body, function (err, result) {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate 
        return next(createError(400, "Bad request body. User already exists."));
      }

      return next(err);
    }
    return res.send();
  }); 
}

module.exports = AuthnController;

