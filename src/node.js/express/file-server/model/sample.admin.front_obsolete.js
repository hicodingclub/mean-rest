const schema = require('./schema');

const { fileSchema, fileGroupSchema } = schema;

const fB = 'link name labels size uploaded (hasThumbnail)';
const fD = 'link name labels type size md5 uploaded hasThumbnail';
const fC = 'link name labels';
const fE = 'name labels';
const fTS = 'name labels';  // fields that can make text search on.
const fI = 'name';

const lB = 'label';
const lD = 'label created';
const lC = 'label';
const lE = 'label';
const lTS = '';  // fields that can make text search on.
const lI = 'label';

const dateFormat = 'MM/DD/YYYY';
const timeFormat = 'hh:mm:ss';

const schemas = {
  'mfile': {
     schema: fileSchema,
     views: [fB, fD, fC, fE, fTS, fI],
     api: 'LRCUD',  // api exposed by rest controller
  },
  'mfilelabels': {
     schema: fileLabelsSchema,
     views: [lB, lD, lC, lE, lTS, lI],
     api: 'L', // api exposed by rest controller
  },
  'upload': {},
  'download': {},
  'delete': {},
};
const config = {
  dateFormat,
  timeFormat,
  // patch: ['mmodule_name'], //extra fields to patch to schema
  owner: {enable: true, type: 'module'},
};

const authz = {
  'module-authz': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': ''},
  'download': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': 'R'},
};

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'FILE',
};
module.exports = {schemas, config, authz, DB_CONFIG};
