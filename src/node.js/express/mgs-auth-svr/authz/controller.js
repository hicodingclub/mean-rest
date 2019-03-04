const meanRestExpress = require('mean-rest-express')

const restController = meanRestExpress.restController;

const AuthzController = function() {
}

AuthzController.getAccountRoles = function(req, res, next) {
  if (!req.muser) {
    let err = new Error("Authorization: User not available for getting roles.");
    return next(err);
  }

  let userId = req.muser['_id'];
  if (!userId) return next(); //without setting roles. User becomes normal login user.
  
  restController.ModelExecute(
          "maccountrole",
          'findOne',
          {account: userId} //search criteria
      ).then(
        function(result) {
          if (result) { //role defined for the user
            req.muser.role = result.role; //[] array of role ids
          } else {
            req.muser.role = [];
          }
          return next();
        }, 
        function(err) {
          return next(err); 
        }
      );
}

module.exports = AuthzController;
