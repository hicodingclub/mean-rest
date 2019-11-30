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
     name: 'Picture',
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
     name: 'Picture Group',
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
  patch: ['mmodule_name'], //extra fields to patch to schema
  owner: {enable: true, type: 'module'},
};

const authz = {
  'module-authz': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': ''},
  'download': {'LoginUser': {'others': '', 'own': ''}, 'Anyone': 'R'},
};

module.exports = {schemas, config, authz};
