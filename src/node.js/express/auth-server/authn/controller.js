const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const mongoose = require('mongoose');

const REFRESH_SECRETE = 'server refresh secret random';
const ACCESS_SECRETE = 'server secret random';
const EMAIL_RESET_SECRETE = 'server secret random for email reset';

class AuthnController {

  constructor() {
    this.authSchemas = {};
    this.mddsProperties = {};
  }

  registerAuth(schemaName, schema, userFields, passwordField) {
    let a = {};
    a.schemaName = schemaName;
    a.userFields = userFields;
    a.passwordField = passwordField;
    
    
    a.schema = schema;
    a.model = mongoose.model(schemaName, schema );//model uses given name
    
    this.authSchemas[schemaName] = a;
  }
  
  authLogin(req, res, next) {
    let authSchemaName = req.authSchemaName;
    let auth = this.authSchemas[authSchemaName];
    let model = auth.model;
    if (!model) {
      return next(createError(400, "Authentication server is not provisioned."));
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
    
    if (body['resetToken']) {
      return next(); // this is a password reset. go to next handler.
    }

  
    let password;
    if (body[auth.passwordField]) {
        password = body[auth.passwordField];
    }
  
    if (!userName || !password) {
      return next(createError(400, "Request is missing required information (user name, or password)."));
    }
  
    let query = {};
    query[fieldName] = userName;
    model.findOne(query, function(err, user) {
      if (err) {
        return next(err); 
      }
      if (!user) {
        return next(createError(403, "User does not exist."));
      }
      if (user.status !== 'Enabled') {
        return next(createError(403, "User is currently disabled."));
      }
      // test a matching password
      user.comparePassword(password, function(err, isMatch) {
          if (err || !isMatch) return next(createError(403, "Password is incorrect."));
          req.muser = {
            "_id": user["_id"], 
            "userName": userName,
            "fieldName": fieldName
          };
          return next(); //don't send response. need generate Token.
      });
    });
  }
  
  generateToken(req, res, next) {
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
  
  verifyRefreshToken(req, res, next) {  
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
  
  authRefresh(req, res, next) {
    let { _id, userName, fieldName} = req.muser;
    
    let authSchemaName = req.authSchemaName;
    let auth = this.authSchemas[authSchemaName];
    let model = auth.model;
    if (!model) {
      return next(createError(400, "Authentication server is not provisioned."));
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
  
  authRegister(req, res, next) {
    let authSchemaName = req.authSchemaName;
    let auth = this.authSchemas[authSchemaName];
    let model = auth.model;
    if (!model) {
      return next(createError(400, "Authentication server is not provisioned."));
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
  };
  
  changePass(req, res, next) {
    let authSchemaName = req.authSchemaName;
    let auth = this.authSchemas[authSchemaName];
    let model = auth.model;
    if (!model) {
      return next(createError(400, "Authentication server is not provisioned."));
    }
    
    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch(e) {
          return next(createError(400, "Bad request body."));
        }
    }
    
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

    let resetToken;
    if (body['resetToken']) {
      resetToken = body['resetToken'];
    }
  
    let password;
    if (body['newPassword']) {
        password = body['newPassword'];
    }
  
    if (!password) {
      return next(createError(400, "Bad request: missing required information (new password)."));
    }

    if (!resetToken && !userName) {
      return next(createError(400, "Bad request: missing required information (user info)."));
    }

    const query = {};

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, EMAIL_RESET_SECRETE);

        query['email'] = decoded.email;
      } catch (err) {
        return next(createError(400, "Bad request: invalid reset token."));
      }
    } else {
      query[fieldName] = userName;
    }
  
  
    model.findOne(query, function (err, result) {
      if (err) {
        return next(err);
      }
      result[auth.passwordField] = password;
  
      result.save(function (err, r) {
        if (err) {
          return next(err);
        }
        return res.send();
      });
    });
  
  };
  
  findPass(req, res, next) {
    let authSchemaName = req.authSchemaName;
    let auth = this.authSchemas[authSchemaName];
    let model = auth.model;
    if (!model) {
      return next(createError(400, "Authentication server is not provisioned."));
    }
    
    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch(e) {
          return next(createError(400, "Bad request body."));
        }
    }
    
    let email;
    if (body['email']) {
      email = body['email'];
    }
  
    if (!email) {
      return next(createError(400, "Bad request: missing required information (email)."));
    }
  
    const query = {};
    query['email'] = email;
  
    model.findOne(query, async (err, result) => {
      if (err) {
        return next(err);
      }
      if (!result) {
        return next(createError(400, "Bad request: user not registered."));
      }
      let resetToken = jwt.sign(
        {email}, 
        EMAIL_RESET_SECRETE, 
        {expiresIn: 60*60*24}
      );
  
      let userName = 'user';
      const { emailer, emailerObj } = this.mmdsProperties || {};

      if (!emailer) {
        return next(createError(503, 'Emailing service is not available'));
      }
      const tag = 'resetpassword';
      const obj = {
        userName,
        link: emailerObj.serverUrlPasswordReset + resetToken
      };
      try {
        const result = await emailer.sendEmailTemplate([email], tag, obj);
        // result: {success: 1, fail: 0, errors: []}
        if (result.success == 1) {
          return res.send();
        }
        return next(result.errors[0] || new Error('Email send failed: unknown error.'));
      } catch (err2) {
        return next(err2);
      }
    });
  
  };
}


module.exports = AuthnController;

