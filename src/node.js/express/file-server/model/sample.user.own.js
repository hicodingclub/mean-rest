const schema = require('./schema');

const { fileSchema, fileGroupSchema, pictureSchema, pictureGroupSchema, DB_CONFIG } = schema;

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
  const schemaDef1 = { // fileSchemaDef, pictureSchemaDef
    schema: schema1,
    views: [fB, fD, fC, fE, fTS, fI],
    api: 'LU',  // api exposed by rest controller
    name: name,
    mraUI: {
      listCategories: [
        {
          listCategoryField: 'group',
          showCategoryCounts: true,
          showEmptyCategory: false,
        },
      ],
     },
  };

  const schemaDef2 = { // fileGroupDef, pictureGroupDef
    schema: schema2,
    views: [lB, lD, lC, lE, lTS, lI],
    api: 'LRCU', // api exposed by rest controller
    name: `${name} Group`,
    mraUI: {
     listSelectType: 'index',
    },
  }

  return [schemaDef1, schemaDef2];
}

const [mfileDef, mfilegroupDef] = getSchemaDef('file', fileSchema, fileGroupSchema);
const [mpictureDef, mpicturegroupDef] = getSchemaDef('file', pictureSchema, pictureGroupSchema);
const schemas = {
  'mfile': mfileDef,
  'mfilegroup': mfilegroupDef,
  'mpicture': mpictureDef,
  'mpicturegroup': mpicturegroupDef,
  'upload': {},
  'download': {},
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

module.exports = {schemas, config, authz, DB_CONFIG};
