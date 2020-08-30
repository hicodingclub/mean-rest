const { fileSchema, fileGroupSchema } = require('./schema');
const { hooks } = require('./hooks');

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
     api: 'LUD',  // api exposed by rest controller
     name: 'File',
     mraUI: {
      mraUI: {
        listWidgets: {
          general: {
            views: ['list', 'table', 'grid',],
          },
          select: {
            views: ['list', 'table',],
          },
          sub: {
            views: ['list', 'table',],
          }
        },
        listWidgetTypes: {
          general: 'general',
          select: 'select',
          sub: 'sub',
        },
      },
      listCategories: [
        {
          listCategoryField: 'group',
          showCategoryCounts: true,
          showEmptyCategory: false,
        },
      ],
     },
     mraBE: {
      hooks,
     },
  },
  'mfilegroup': {
     schema: fileGroupSchema,
     views: [lB, lD, lC, lE, lTS, lI],
     api: 'LRCU', // api exposed by rest controller
     name: 'File Group',
     mraUI: {
      listWidgets: {
        general: {
          views: ['table', 'list', 'grid',],
        },
        select: {
          views: ['index', 'table', 'list',],
        },
        sub: {
          views: ['table', 'list',],
        }
      },
      listWidgetTypes: {
        general: 'general',
        select: 'select',
        sub: 'sub',
      },
    },
  },
  'upload': {},
  'download': {},
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

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'FILE',
};
module.exports = {schemas, config, authz, DB_CONFIG};
