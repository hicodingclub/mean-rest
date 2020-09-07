const { fileSchema, fileGroupSchema, pictureSchema, pictureGroupSchema, DB_CONFIG } = require('./schema');
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

function getSchemaDef(fileCategory, schema1, schema2) {
  const name = fileCategory.charAt(0).toUpperCase() + fileCategory.slice(1);

  // fileSchemaDef, pictureSchemaDef
  const schemaDef1 = {
    schema: schema1,
    views: [fB, fD, fC, fE, fTS, fI],
    api: 'LUD',  // api exposed by rest controller
    name: name,
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
  };

  // fileGroupDef, pictureGroupDef
  const schemaDef2 = {
    schema: schema2,
    views: [lB, lD, lC, lE, lTS, lI],
    api: 'LRCU', // api exposed by rest controller
    name: `${name} Group`,
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
  }

  return [schemaDef1, schemaDef2];
}

const [mfileDef, mfilegroupDef] = getSchemaDef('file', fileSchema, fileGroupSchema);
const [mpictureDef, mpicturegroupDef] = getSchemaDef('picture', pictureSchema, pictureGroupSchema);

const schemas = {
  'mpicture': mpictureDef,
  'mpicturegroup': mpicturegroupDef,
  'mfile': mfileDef,
  'mfilegroup': mfilegroupDef,
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

module.exports = {schemas, config, authz, DB_CONFIG};
