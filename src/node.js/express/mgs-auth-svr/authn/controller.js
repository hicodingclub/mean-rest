const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const mongoose = require('mongoose');

let authSchemas = {};
let accountAuth = {};
let AuthnController = function() {
}

const REFRESH_SECRETE = 'server refresh secret random';
const ACCESS_SECRETE = 'server secret random';

AuthnController.registerAuth = function(schemaName, schema, userFields, passwordField) {
  let a = {};
  a.schemaName = schemaName;
  a.userFields = userFields;
  a.passwordField = passwordField;
  
  
  a.schema = schema;
  a.model = mongoose.model(schemaName, schema );//model uses given name
  
  authSchemas[schemaName] = a;
}

AuthnController.authLogin = function(req, res, next) {
  let authSchemaName = req.authSchemaName;
  let auth = authSchemas[authSchemaName];
  let model = auth.model;
  if (!model) {
    return next(createError(400, "Authentication server not provisioned for your request."));
  }
  
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
    if (user.status !== 'Enabled') {
      return next(createError(403, "Bad login request: User not enabled."));
    }
    // test a matching password
    user.comparePassword(password, function(err, isMatch) {
        if (err || !isMatch) return next(createError(403, "Bad login request: Password."));
        req.muser = {
          "_id": user["_id"], 
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
    ACCESS_SECRETE, 
    {expiresIn: 60*60}
  );

  let refreshToken = jwt.sign(
    req.muser, 
    REFRESH_SECRETE, 
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

  jwt.verify(token, REFRESH_SECRETE, function(err, decoded) {
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
  let { _id, userName, fieldName} = req.muser;
  
  let authSchemaName = req.authSchemaName;
  let auth = authSchemas[authSchemaName];
  let model = auth.model;
  if (!model) {
    return next(createError(400, "Authentication server not provisioned for your request."));
  }
    
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
          'userName': userName,
          'fieldName': fieldName
        };
    return next(); //don't send response. need generate Token.
  });
}

AuthnController.authRegister = function(req, res, next) {
  let authSchemaName = req.authSchemaName;
  let auth = authSchemas[authSchemaName];
  let model = auth.model;
  if (!model) {
    return next(createError(400, "Authentication server not provisioned for you request."));
  }
  
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

