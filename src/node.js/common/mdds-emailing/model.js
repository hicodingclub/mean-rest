const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const validateEmail = function(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
}

const emailTemplateSchema = new Schema({
  templateName: { type: String, required: true },
  fromEmail: {
    type: String,
    trim: true,
    lowercase: true,
    //required: 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'], 
  },
  subject: { type: String, required: true },
  content: { type: String, editor: true, required: true },
  tag: { type: String, required: true, unique: true },
});

const brief = "templateName fromEmail subject tag";
const detail = "templateName fromEmail subject content tag";
const create = "templateName fromEmail subject content tag";
const edit = "templateName fromEmail subject content tag";
const testSearch = "templateName fromEmail subject content tag";
const index = "templateName";

const schemas = {
  "emailTemplate": {
    schema: emailTemplateSchema,
    views: [brief, detail, create, edit, testSearch, index],
    name: 'Email Template'
  }
};

const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = {
  "module-authz": {"LoginUser": {"others": "", "own": "R"}, "Anyone": ""},
  "muser": {"LoginUser": {"others": "", "own": "R"}, "Anyone": ""}
}

module.exports = {schemas: schemas, config: config, authz: authz}
