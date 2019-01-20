const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roleSchema = new Schema({
  role: { type: String, required: true, index: { unique: true }, maxlength: 50 },
  description: { type: String, maxlength: 200}
});

const roleSchema = new Schema({
  role: { type: String, required: true, index: { unique: true }, maxlength: 50 },
  description: { type: String, maxlength: 200}
});

const userBrief = "username email phone";
const userDetail = "username email phone";
const userCreat = "username email phone password";
const userEdit = "username email phone password";
const userTextSearch = "username email phone";
const userIndex = "username";


const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const schemas = {
  "muser": {
    schema: userSchema,
    views: [userBrief, userDetail, userCreat, userEdit, userTextSearch, userIndex],
  }
};
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
  "module-authz": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
  "muser": {"LoginUser": {"others": "", "own": "RU"}, "Anyone": ""}
}

module.exports = {schemas: schemas, config: config, authn: authn, authz: authz}
