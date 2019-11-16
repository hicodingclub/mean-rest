const bcrypt = require('bcrypt');

const SALT_WORK_FACTOR = 10;

const addPasswordHandlers = function(schema, authPassword) {
  schema.pre('save', function(next) {
    let user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified(authPassword)) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(user[authPassword], salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user[authPassword] = hash;
            next();
        });
    });
  });
  
  schema.options.useSaveInsteadOfUpdate = true; //this is a special indicator to controller use save.
  
  schema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this[authPassword], function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
  };
  
  return schema;
}

module.exports = addPasswordHandlers; 
