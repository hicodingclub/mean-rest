const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const emailTemplateSchema = new Schema(
  {
    templateName: { type: String, required: true },
    fromEmail: {
      type: String,
      trim: true,
      lowercase: true,
      //required: 'Email address is required',
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
      description:
        'Leave it blank if default sender email address in email settings is used',
    },
    toEmails: {
      type: [{
        type: String,
        trim: true,
        lowercase: true,
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please fill a valid email address',
        ],
      }],
      description: 'Email will be sent to these recipients if not specified',
    },
    subject: { type: String, required: true },
    content: { type: String, editor: true, required: true },
    tag: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);
emailTemplateSchema.index({ tag: 1 }, { unique: true }); // schema level

const brief = 'templateName fromEmail subject tag';
const detail = 'templateName fromEmail toEmails subject content tag';
const create = 'templateName fromEmail toEmails subject content tag';
const edit = 'templateName fromEmail toEmails subject content tag';
const textSearch = 'templateName fromEmail toEmails subject content tag';
const index = 'templateName';

const emailLogSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

const brief2 = 'to module reason result userId createdAt';
const detail2 =
  'from to subject content template module reason result userId createdAt';
const create2 = 'subject content template';
const edit2 = 'subject content template';
const textSearch2 = 'subject content';
const index2 = 'module';

const queueSchema = new Schema(
  {
    from: { type: String },
    to: { type: String },
    number: { type: Number },
    subject: { type: String },
    content: { type: String, editor: true },
    replacements: { type: String },
    defaultReplacement: { type: String },
    processed: { type: Boolean, default: false },
    sent: { type: Number, default: 0 },
    fail: { type: Number, default: 0 },
    result: { type: String },
  },
  { timestamps: true }
);
const brief4 = 'subject processed number sent createdAt';
const detail4 =
  'subject from to  processed number sent result createdAt updatedAt content replacements defaultReplacement';
const create4 =
  'subject from to subject processed number sent result content replacements defaultReplacement';
const edit4 =
  'subject from to processed number sent result content replacements defaultReplacement';
const textSearch4 = 'subject content';
const index4 = 'subject';

const emailSettingsSchema = new Schema({
  settingName: { type: String, required: true },
  hiddenUnique: { type: String, default: 'unique' }, // hidden filed to make sure it is unique
  defaultSender: {
    type: String,
    trim: true,
    lowercase: true,
    required: true, // 'Email address is required',
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
    description:
      'Default sender email address. Must be validated by email service for it to take effect.',
  },
});
//to make the association unique
emailSettingsSchema.index({ hiddenUnique: 1 }, { unique: true }); // schema level

const brief3 = 'settingName defaultSender[Default Sender Email Address]';
const detail3 = 'settingName defaultSender[Default Sender Email Address]';
const create3 = 'settingName defaultSender[Default Sender Email Address]';
const edit3 = 'defaultSender[Default Sender Email Address]';
const textSearch3 = 'defaultSender';
const index3 = 'settingName';

const schemas = {
  emailTemplate: {
    schema: emailTemplateSchema,
    views: [brief, detail, create, edit, textSearch, index],
    name: 'Email Template',
  },
  emailSettings: {
    schema: emailSettingsSchema,
    views: [brief3, detail3, create3, edit3, textSearch3, index3],
    name: 'Email Settings',
    singleRecord: true, //single record for configuration
    api: 'LRU', // don't allow delete and create - single record
  },
  emailQueue: {
    schema: queueSchema,
    views: [brief4, detail4, create4, edit4, textSearch4, index4],
    name: 'Email Queue',
    api: 'LRU',
    mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid'],
        },
        select: {
          views: ['table', 'list'],
        },
        sub: {
          views: ['table', 'list'],
        },
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
      defaultListSort: { createdAt: 'desc' },
    },
  },
  /*
  'emailLog': {
    schema: emailLogSchema,
    views: [brief2, detail2, create2, edit2, textSearch2, index2],
    name: 'Email Log',
    api: 'LR',
  },
  */
};

const dateFormat = 'MM-DD-YYYY';
const timeFormat = 'hh:mm:ss';

const config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
};

const authz = {
  'module-authz': { LoginUser: { others: 'R', own: 'R' }, Anyone: '' },
  emailTemplate: { LoginUser: { others: 'R', own: 'R' }, Anyone: '' },
  emailLog: { LoginUser: { others: '', own: 'R' }, Anyone: '' },
};

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'EMAIL',
};

module.exports = { schemas: schemas, config: config, authz: authz, DB_CONFIG };
