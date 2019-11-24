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
    description: 'Leave it blank if default sender email address in email settings is used'
  },
  subject: { type: String, required: true },
  content: { type: String, editor: true, required: true },
  tag: { type: String, required: true, unique: true },
}, {timestamps: true});

const brief = 'templateName fromEmail subject tag';
const detail = 'templateName fromEmail subject content tag';
const create = 'templateName fromEmail subject content tag';
const edit = 'templateName fromEmail subject content tag';
const textSearch = 'templateName fromEmail subject content tag';
const index = 'templateName';

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
  userId: { type: String },
}, {timestamps: true});

const brief2 = 'to module reason result userId createdAt';
const detail2 = 'from to subject content template module reason result userId createdAt';
const create2 = 'subject content template';
const edit2 = 'subject content template';
const textSearch2 = 'subject content';
const index2 = 'module';

const emailSettingsSchema = new Schema({
  settingName: { type: String, required: true },
  hiddenUnique: { type: String, default: 'unique'}, // hidden filed to make sure it is unique
  defaultSender: {
    type: String,
    trim: true,
    lowercase: true,
    required: true, // 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    description: 'Default sender email address. Must be validated by email service for it to take effect.'
  },
});
//to make the association unique
emailSettingsSchema.index({ hiddenUnique: 1}, {unique: true}); // schema level

const brief3 = 'settingName defaultSender[Default Sender Email Address]';
const detail3 = 'settingName defaultSender[Default Sender Email Address]';
const create3 = 'settingName defaultSender[Default Sender Email Address]';
const edit3 = 'defaultSender[Default Sender Email Address]';
const textSearch3 = 'defaultSender';
const index3 = 'settingName';

const schemas = {
  'emailTemplate': {
    schema: emailTemplateSchema,
    views: [brief, detail, create, edit, textSearch, index],
    name: 'Email Template'
  },
  'emailSettings': {
    schema: emailSettingsSchema,
    views: [brief3, detail3, create3, edit3, textSearch3, index3],
    name: 'Email Settings',
    singleRecord: true, //single record for configuration
    api: 'LRU', // don't allow delete and create - single record
  },
  'emailLog': {
    schema: emailLogSchema,
    views: [brief2, detail2, create2, edit2, textSearch2, index2],
    name: 'Email Log',
    api: 'LR',
  },
};

const dateFormat = 'MM-DD-YYYY';
const timeFormat = 'hh:mm:ss';

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = {
  'module-authz': {'LoginUser': {'others': 'R', 'own': 'R'}, 'Anyone': ''},
  'emailTemplate': {'LoginUser': {'others': 'R', 'own': 'R'}, 'Anyone': ''},
  'emailLog': {'LoginUser': {'others': '', 'own': 'R'}, 'Anyone': ''},
}

module.exports = {schemas: schemas, config: config, authz: authz}
