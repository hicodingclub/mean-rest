const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const mongoose = require('mongoose');

const REFRESH_SECRETE = 'server refresh secret random';
const ACCESS_SECRETE = 'server secret random';
const EMAIL_RESET_SECRETE = 'server secret random for email reset';
const EMAIL_REGISTRATION_SECRETE = 'server secret random for email registration verification';

class AuthnController {

  constructor(options) {
    this.authSchemas = {};
    this.mddsProperties = options || {};
  }

  registerAuth(schemaName, schema, userFields, passwordField, profileFields) {
    let a = {};
    a.schemaName = schemaName;
    a.userFields = userFields;
    a.passwordField = passwordField;
    a.profileFields = profileFields;
    
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
      return next(); // this is a password reset from email, no need to compare password. go to next handler.
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
      if (user.status === 'Disabled') {
        return next(createError(403, "User is currently disabled."));
      }
      if (user.status === 'Pending') {
        return next(createError(403, "User is currently pending for verification."));
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
  
  getProfile(req, res, next) {
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
      const profile = {"_id": user["_id"]};
      let profileFields = [];
      if (auth.profileFields) {
        profileFields = auth.profileFields.split(' ');
      }
      for (const f of profileFields) {
        profile[f] = user[f];
      }

      return res.send(profile);
    });
  }

  updateProfile(req, res, next) {
    let { _id, userName, fieldName} = req.muser;
    
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
    if (body._id !== _id) {
      return next(createError(403, "User id doesn't match."));
    }

    let query = {};
    query["_id"] = _id;
    model.findOne(query, function (err, result) {
      if (err) {
        return next(err);
      }

      const profile = {"_id": _id};
      let profileFields = [];
      if (auth.profileFields) {
        profileFields = auth.profileFields.split(' ');
      }
      for (const f of profileFields) {
        if (!(f in body)) {
          //not in body means user deleted this field
          // delete result[field]
          result[f] = undefined;
        } else {
          result[f] = body[f];
          profile[f] = body[f];
        }
      }
      result.save(function (err, result) {
        if (err) {
          return next(err);
        }
        return res.send(profile);
      });
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
  
    const registrationEmailVerification = this.mddsProperties.registerEmailVerification;
    if (registrationEmailVerification) {
      body.status = "Pending";
    }
    model.create(body, async (err, result) => {
      if (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
          // Duplicate 
          return next(createError(400, "Bad request body. User already exists."));
        }
        return next(err);
      }
      if (registrationEmailVerification) {
        let email = body['email'];
        let userName = 'user';
        try {
          await this.sendRegVerificationEmail(userName, email);
        } catch (err1) {
          return next(err1);
        }
      }
      const returnObj = {registrationEmailVerification};
      return res.send(returnObj);
    }); 
  };

  authVerifyReg(req, res, next) {
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
    
    if (!body || !body.verificationToken) {
      return next(createError(400, "Bad verification request: missing token info."));
    }
    const verificationToken = body.verificationToken;
    const query = {};
    try {
      const decoded = jwt.verify(verificationToken, EMAIL_REGISTRATION_SECRETE);
      query['email'] = decoded.email;
    } catch (err) {
      return next(createError(400, "Bad request: invalid registration token."));
    }

    model.findOne(query, function (err, result) {
      if (err) {
        return next(err);
      }
      if (result['status'] === 'Disabled') {
        return next(createError(403, "User is currently disabled."));
      }
      if (result['status'] === 'Enabled') {
        return res.send();
      }
      result['status'] = 'Enabled';
  
      result.save(function (err1, r) {
        if (err1) {
          return next(err1);
        }
        return res.send();
      });
    });
  }

  // Not used yet.
  authResendRegVerification(req, res, next) {
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
      if (result.status !== 'Pending') {
        return next(createError(400, "Bad request: user has been verified."));
      }
      try {
        let userName = 'user';
        await this.sendRegVerificationEmail(userName, email);
      } catch (err1) {
        return next(err1);
      }
      return res.send();
    });
  }

  async sendRegVerificationEmail(userName, email) {
    const { emailer, emailerObj } = this.mddsProperties || {};

    if (!emailer) {
      throw createError(503, 'Emailing service is not available');
    }

    let verificationToken = jwt.sign(
      {email}, 
      EMAIL_REGISTRATION_SECRETE, 
      {expiresIn: 60*60*24*30} // 30 days
    );

    const tag = 'registrationverification';
    const obj = {
      userName,
      link: emailerObj.serverUrlRegVerification + verificationToken
    };
    const result = await emailer.sendEmailTemplate([email], tag, obj);
    // result: {success: 1, fail: 0, errors: []}
    if (result.success !== 1) {
      throw result.errors[0] || new Error('Email send failed: unknown error.');
    }
    return;
  }
  
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

    // this function is called, either passing the authLogin username/password check, of from a token;
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
      const { emailer, emailerObj } = this.mddsProperties || {};

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
        if (result.success !== 1) {
          return next(result.errors[0] || new Error('Email send failed: unknown error.'));
        }
      } catch (err2) {
        return next(err2);
      }
      return res.send();
    });
  };
}


module.exports = AuthnController;

