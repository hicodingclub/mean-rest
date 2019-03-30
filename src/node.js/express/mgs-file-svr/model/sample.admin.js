const schema = require('./schema');

const fileSchema = schema.fileSchema;
const fB = 'name type labels size link uploaded thumbnail';
const fD = 'name type labels size link uploaded thumbnail';
const fC = 'name labels';
const fE = 'name labels';
const fTS = 'name labels';  // fields that can make text search on.
const fI = 'name';

const fileLabelsSchema = schema.fileLabelsSchema
  
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
     api: 'LU',  // api exposed by rest controller
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
  patch: ['mmodule_name'], //extra fields to patch to schema
  owner: {enable: true, type: 'module'},
};

const authz = {
  'module-authz': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': ''},
  'download': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': 'R'},
};

module.exports = {schemas, config, authz};
