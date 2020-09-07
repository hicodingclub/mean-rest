const { fileSchema, fileGroupSchema, pictureSchema, pictureGroupSchema, DB_CONFIG } = require('./schema');

const fB = 'link name createdAt[Upload time] (size) (group)';
const fD = 'link name type group labels size createdAt hasThumbnail';
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
    api: 'L',  // api exposed by rest controller
    name: name,
    mraUI: {
      listWidgets: {
        general: {
          views: ['gallery-bottom-title',],
        },
        select: {
          views: [],
        },
        sub: {
          views: [],
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
         showEmptyCategory: true,
       },
     ],
    }
  };

  // fileGroupDef, pictureGroupDef
  const schemaDef2 = {
    schema: schema2,
    views: [lB, lD, lC, lE, lTS, lI],
    api: 'LCU', // api exposed by rest controller
    name: `${name} Group`,
    mraUI: {
      listWidgets: {
        general: {
          views: [],
        },
        select: {
          views: ['index',],
        },
        sub: {
          views: [],
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
};

const authz = {};

module.exports = {schemas, config, authz, DB_CONFIG};
