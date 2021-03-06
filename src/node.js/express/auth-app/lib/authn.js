const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const ACCESS_SECRETE = 'server secret random';

const verifyToken = function(req, res, next) {
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
    req.muser = undefined;
    return next();
  }

  jwt.verify(token, ACCESS_SECRETE, function(err, decoded) {
    if (err || !decoded) {
      // A bad token. Reject the request.
      return next(createError(401, "Not Authorized.")); // so user can login to get it
    }
    req.muser = decoded;
    return next();
  });
}

module.exports = verifyToken;

