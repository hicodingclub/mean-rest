var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
}

var validatePhone = function(phone) {
  var re = /^(\d+-?)+\d+$/;
  return re.test(phone)
}

var userSchema = new Schema({
  username: { type: String, required: true, index: { unique: true, sparse: true } },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true, sparse: true },
    //required: 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']    
  },
  phone: {
    type: String,
    trim: true,
    index: { unique: true, sparse: true },
    validate: [validatePhone, 'Please fill a valid phone number']
  },
  password: { type: String, required: true }
});

var userBrief = "username email phone";
var userDetail = "username email phone";
var userCreat = "username email phone password";
var userEdit = "username email phone password";
var userTextSearch = "username email phone";
var userIndex = "username";


var dateFormat = "MM-DD-YYYY";

var schemas = {
  "muser": {
    schema: userSchema,
    views: [userBrief, userDetail, userCreat, userEdit, userTextSearch, userIndex],
  }
};
var config = {
  dateFormat: dateFormat,
  
  authUserSchema: "muser",
  authUserFields: "username email phone",
  authPasswordField: "password"
}

module.exports = {schemas: schemas, config: config}
