const meanRestExpress = require('@hicoder/express-core')

const AuthzController = function() {
}

AuthzController.getAccountRoles = function(restController) {
  function func(req, res, next) {
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
  return func;
}

module.exports = AuthzController;
