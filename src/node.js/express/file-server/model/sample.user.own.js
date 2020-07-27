const schema = require('./schema');

const { fileSchema, fileGroupSchema } = schema;

const fB = 'name type group labels size link createdAt hasThumbnail';
const fD = 'name type group labels size link createdAt hasThumbnail';
const fC = 'name group labels';
const fE = 'name group labels';
const fTS = 'name labels';  // fields that can make text search on.
const fI = 'name';
  
const lB = 'name';
const lD = 'name createdAt';
const lC = 'name';
const lE = 'name';
const lTS = '';  // fields that can make text search on.
const lI = 'name';

const dateFormat = 'MM/DD/YYYY';
const timeFormat = 'hh:mm:ss';

const schemas = {
  'mfile': {
     schema: fileSchema,
     views: [fB, fD, fC, fE, fTS, fI],
     api: 'LU',  // api exposed by rest controller
     name: 'File',
     mraUI: {
      listCategories: [
        {
          listCategoryField: 'group',
          showCategoryCounts: true,
          showEmptyCategory: false,
        },
      ],
     },
  },
  'mfilegroup': {
     schema: fileGroupSchema,
     views: [lB, lD, lC, lE, lTS, lI],
     api: 'LRCU', // api exposed by rest controller
     name: 'File Group',
     mraUI: {
      listSelectType: 'index',
     },
  },
  'upload': {},
  'download': {},
  'delete': {},
};
const config = {
  dateFormat,
  timeFormat,
  // patch: ['muser_id'], //extra fields to patch to schema
  owner: { enable: true, type: 'user', field: 'muser_id' },
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
