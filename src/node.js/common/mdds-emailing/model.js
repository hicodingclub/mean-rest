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
}, {timestamps: true});

const brief = "templateName fromEmail subject tag";
const detail = "templateName fromEmail subject content tag";
const create = "templateName fromEmail subject content tag";
const edit = "templateName fromEmail subject content tag";
const textSearch = "templateName fromEmail subject content tag";
const index = "templateName";

const emailLogSchema = new Schema({
  from: { type: String },
  to: { type: String },
  cc: { type: String },
  bcc: { type: String },
  subject: { type: String },
  content: { type: String, editor: true },
  template: { type: String },
  module: { type: String, required: true },
  reason: { type: String, required: true },
  result: { type: String, required: true },
  userId: { type: String }
}, {timestamps: true});

const brief2 = "to module reason result userId createdAt";
const detail2 = "from to subject content template module reason result userId createdAt";
const create2 = "subject content template";
const edit2 = "subject content template";
const textSearch2 = "templateName fromEmail subject content tag";
const index2 = "module";

const schemas = {
  "emailTemplate": {
    schema: emailTemplateSchema,
    views: [brief, detail, create, edit, textSearch, index],
    name: 'Email Template'
  },
  "emailLog": {
    schema: emailLogSchema,
    views: [brief2, detail2, create2, edit2, textSearch2, index2],
    name: 'Email Log',
    api: "LR",
  },
};

const dateFormat = "MM-DD-YYYY";
const timeFormat = "hh:mm:ss";

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = {
  "module-authz": {"LoginUser": {"others": "R", "own": "R"}, "Anyone": ""},
  "emailTemplate": {"LoginUser": {"others": "R", "own": "R"}, "Anyone": ""},
  "emailLog": {"LoginUser": {"others": "", "own": "R"}, "Anyone": ""},
}

module.exports = {schemas: schemas, config: config, authz: authz}
