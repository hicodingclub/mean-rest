const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
}

const validatePhone = function(phone) {
  var re = /^(\d+-?)+\d+$/;
  return re.test(phone)
}

const userSchema = new Schema({
  username: { type: String, required: true, index: { unique: true, sparse: true } },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true, sparse: true },
    //required: 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'], 
  },
  phone: {
    type: String,
    trim: true,
    index: { unique: true, sparse: true },
    validate: [validatePhone, 'Please fill a valid phone number']
  },
  status:    {type: String, enum: ['Enabled', 'Disabled', 'Pending'], default: 'Enabled'},
  since: { type: Date, default: Date.now },
  password: { type: String, required: true }
});

const userBrief = "username email phone since status";
const userDetail = "username email phone since status";
const userCreat = "username email phone status password";
const userEdit = "username email phone status";
const userTextSearch = "username email phone";
const userIndex = "username";

const schemas = {
  "muser": {
    schema: userSchema,
    views: [userBrief, userDetail, userCreat, userEdit, userTextSearch, userIndex],
    name: 'User'
  }
};

const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authn = {
  authUserSchema: "muser",
  authUserFields: "username email phone",
  authPasswordField: "password"
}

const authz = {
  "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""},
  "muser": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
}

module.exports = {schemas: schemas, config: config, authn: authn, authz: authz}
