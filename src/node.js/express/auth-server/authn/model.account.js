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

const accountSchema = new Schema({
  username: { type: String, required: true, index: { unique: true, sparse: true } },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: { unique: true, sparse: true },
    //required: 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    mraEmailRecipient: true, // if this email can be used by sendEmail Action 
  },
  phone: {
    type: String,
    trim: true,
    index: { unique: true, sparse: true },
    validate: [validatePhone, 'Please fill a valid phone number']
  },
  status:    {type: String, enum: ['Enabled', 'Disabled', 'Pending'], default: 'Enabled'},
  since: { type: Date, default: Date.now },
  password: { type: String, required: true },
  firstname: {type: String, maxlength: 100},
  lastname: {type: String, maxlength: 100},
});

const accountBrief = "username email phone firstname lastname since status";
const accountDetail = "username email phone firstname lastname since status";
const accountCreat = "username email phone firstname lastname status password";
const accountEdit = "username email phone firstname lastname status";
const accountTextSearch = "username email phone";
const accountIndex = "username";

const schemas = {
  "maccount": {
    schema: accountSchema,
    views: [accountBrief, accountDetail, accountCreat, accountEdit, accountTextSearch, accountIndex],
    name: 'Account',
    api: 'LRCUDM', // M - email
    mraUI: {
      listType: 'table',
    },
  },
};

const authn = {
  authUserSchema: "maccount",
  authUserFields: "username email phone",
  authProfileFields: "firstname lastname phone email",
  authPasswordField: "password",
};

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'AUTH',
};
module.exports = {schemas: schemas, authn: authn, DB_CONFIG};
