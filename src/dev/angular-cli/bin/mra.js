#!/usr/bin/env node --trace-warnings
/*
 * Script to create angular UI and service code based on Mongoose schema. This is the command line
 * interface for mean-rest-angular package
 *
 */

const FIELD_NUMBER_FOR_SELECT_VIEW = 4;

const ejs = require('ejs');
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');
const relative = require('relative');
const program = require('commander');

const glob = require('glob');

const minimatch = require('minimatch');
const mkdirp = require('mkdirp');
const readline = require('readline');
const sortedObject = require('sorted-object');
const util = require('util');

const js_beautify = require('js-beautify').js;
const html_beautify = require('js-beautify').html;
const css_beautify = require('js-beautify').css;

const MODE_0666 = parseInt('0666', 8);
const MODE_0755 = parseInt('0755', 8);
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');
const VERSION = require('../package').version;

const { Selectors } = require('./selectors');
const { getNewFeatures } = require('./features');
const Util = require('./util');
const { defaultListWidgets, defaultListWidgetTypes,
  setListViewProperties, } = require('./default-widgets');

const logger = require('./log');

const ROOTDIR = __dirname.replace(/bin$/, 'templates');

const _exit = process.exit;

// Re-assign process.exit because of commander
process.exit = exit;

const views_collection = {}; //views in [schema, briefView, detailView, CreateView, EditView, SearchView, IndexView] format
const model_collection = {};

const basedirFile = function (relativePath) {
  return path.join(__dirname, relativePath);
};
const generatedFile = function (outputDir, prefix, outputFile) {
  if (!prefix) prefix = '';
  if (prefix !== '' && !outputFile.startsWith('.')) prefix += '-';
  let file = prefix + outputFile;
  if (outputFile.toLowerCase().startsWith('mdds')) {
    // no change if name starts with 'mdds'
    file = outputFile;
  }
  return path.join(outputDir, file);
};

const templates = {
  //key:[template_file, output_file_suffix, description, write_options]
  //write_options: W: write, A: append
  angular: [
    '../templates/ui/angular/mdds.angular.json',
    'mdds.angular.json',
    'angular configuration file',
    'W',
  ],

  conf: ['../templates/conf.ts', '.conf.ts', 'module conf file', 'A'],
  tokensValue: [
    '../templates/tokens.value.ts',
    '.tokens.value.ts',
    'module token value file',
    'A',
  ],

  mainModule: [
    '../templates/main.module.ts',
    '.module.ts',
    'main module file',
    'W',
  ],
  mainCoreModule: [
    '../templates/main.core.module.ts',
    '.core.module.ts',
    'main module file',
    'W',
  ],
  mainCustModule: [
    '../templates/main.cust.module.ts',
    '.cust.module.ts',
    'main cust module file',
    'A',
  ],
  mainExtModule: [
    '../templates/main.ext.module.ts',
    '.ext.module.ts',
    'main external module file',
    'A',
  ],
  mainComponent: [
    '../templates/main.component.ts',
    '.component.ts',
    'main component file',
    'W',
  ],
  mainComponentHtml: [
    '../templates/main.component.html',
    '.component.html',
    'main component html file',
    'W',
  ],
  mainComponentCss: [
    '../templates/main.component.css',
    '.component.css',
    'main component css file',
    'W',
  ],
  mainDirective: [
    '../templates/main.directive.ts',
    '.directive.ts',
    'main directive file',
    'W',
  ],
  tokens: ['../templates/tokens.ts', '.tokens.ts', 'module token file', 'W'],

  routingModule: [
    '../templates/routing.module.ts',
    'routing.module.ts',
    'routing module file',
    'W',
  ],
  routingCoreModule: [
    '../templates/routing.core.module.ts',
    'routing.core.module.ts',
    'routing core module file',
    'W',
  ],
  routingCorePath: [
    '../templates/routing.core.path.ts',
    'routing.core.path.ts',
    'routing core path file',
    'W',
  ],
  routingCustPath: [
    '../templates/routing.cust.path.ts',
    'routing.cust.path.ts',
    'routing cust path file',
    'A',
  ],
  schemaBaseService: [
    '../templates/schema.base.service.ts',
    '.base.service.ts',
    'base service file',
    'W',
  ],
  schemaService: [
    '../templates/schema.service.ts',
    '.service.ts',
    'service file',
    'W',
  ],
  schemaComponent: [
    '../templates/schema.component.ts',
    '.component.ts',
    'component file',
    'W',
  ],
  schemaListComponent: [
    '../templates/schema-list.component.ts',
    'list.component.ts',
    'list component file',
    'W',
  ],
  schemaListCustComponent: [
    '../templates/schema-list.cust.component.ts',
    'list.cust.component.ts',
    'list customization component file',
    'A',
  ],
  schemaListComponentHtml: [
    '../templates/schema-list.component.html',
    'list.component.html',
    'list component html file',
    'W',
  ],
  schemaListComponentCss: [
    '../templates/schema-list.component.css',
    'list.component.css',
    'list component css file',
    'W',
  ],
  schemaListViewComponent: [
    '../templates/schema-list-view.component.ts',
    'list-view.component.ts',
    'list view component file',
    'W',
  ],

  schemaDetail: [
    [
      '../templates/schema-detail.component.ts',
      'detail.component.ts',
      'detail component file',
      'W',
    ],
    [
      '../templates/schema-detail.component.html',
      'detail.component.html',
      'detail component html file',
      'W',
    ],
    [
      '../templates/schema-detail.component.css',
      'detail.component.css',
      'detail component css file',
      'W',
    ],
    [
      '../templates/schema-detail.cust.component.ts',
      'detail.cust.component.ts',
      'detail customization component file',
      'A',
    ],
  ],

  schemaDetailShowFieldCompoment: [
    '../templates/schema-detail-show-field.component.ts',
    'detail-field.component.ts',
    'detail show field component file',
    'W',
  ],
  schemaDetailShowFieldCompomentHtml: [
    '../templates/schema-detail-show-field.component.html',
    'detail-field.component.html',
    'detail show field component html file',
    'W',
  ],

  schemaDetailAssoComponent: [
    '../templates/schema-detail-asso.component.ts',
    'detail-asso.component.ts',
    'detail association component file',
    'W',
  ],
  schemaDetailAssoComponentHtml: [
    '../templates/schema-detail-asso.component.html',
    'detail-asso.component.html',
    'detail association component html file',
    'W',
  ],

  schemaDetailSelComponent: [
    '../templates/schema-detail-sel.component.ts',
    'detail-sel.component.ts',
    'detail select component file',
    'W',
  ],
  schemaDetailSelComponentHtml: [
    '../templates/schema-detail-sel.component.html',
    'detail-sel.component.html',
    'detail select component html file',
    'W',
  ],
  schemaDetailPopComponent: [
    '../templates/schema-detail-pop.component.ts',
    'detail-pop.component.ts',
    'detail pop component file',
    'W',
  ],
  schemaDetailPopComponentHtml: [
    '../templates/schema-detail-pop.component.html',
    'detail-pop.component.html',
    'detail pop component html file',
    'W',
  ],
  schemaDetailSubComponent: [
    '../templates/schema-detail-sub.component.ts',
    'detail-sub.component.ts',
    'detail sub component file',
    'W',
  ],
  schemaDetailSubComponentHtml: [
    '../templates/schema-detail-sub.component.html',
    'detail-sub.component.html',
    'detail sub component html file',
    'W',
  ],
  schemaDetailSubComponentCss: [
    '../templates/schema-detail-sub.component.css',
    'detail-sub.component.css',
    'detail sub component css file',
    'W',
  ],

  schemaEditComponent: [
    '../templates/schema-edit.component.ts',
    'edit.component.ts',
    'edit component file',
    'W',
  ],
  schemaEditCustComponent: [
    '../templates/schema-edit.cust.component.ts',
    'edit.cust.component.ts',
    'edit customization component file',
    'A',
  ],
  schemaEditComponentHtml: [
    '../templates/schema-edit.component.html',
    'edit.component.html',
    'edit component html file',
    'W',
  ],
  schemaEditComponentCss: [
    '../templates/schema-edit.component.css',
    'edit.component.css',
    'edit component css file',
    'W',
  ],
  mraCss: [
    '../templates/mean-express-angular.css',
    'mean-express-angular.css',
    'mean-rest-angular css file',
    'W',
  ],
};

const PredefinedPatchFields = {
  muser_id: { type: String, index: true },
  mmodule_name: { type: String, index: true },
};

const stripDisplayNames = function (viewStr) {
  const displayNames = {};
  const re = /([^\s\|]+)\[([^\]]*)\]/g; // handle 'field[field displayName]'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      displayNames[m[1]] = m[2];
    }
  } while (m);

  const viewStrDisplayNameHandled = viewStr.replace(/\[[^\]]*\]/g, '');

  return [displayNames, viewStrDisplayNameHandled];
};
const stripFieldHidden = function (viewStr) {
  const fieldHidden = {};
  const re = /\(([^\)]*)\)/g; // handle 'field<fieldMeta>'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      fieldHidden[m[1]] = true;
    }
  } while (m);

  const viewStrHiddenHandled = viewStr.replace(/[\(\)]/g, '');

  return [fieldHidden, viewStrHiddenHandled];
};
const stripFieldMeta = function (viewStr) {
  const fieldMeta = {};
  const re = /([^\s\|]+)<([^>]*)>/g; // handle 'field<fieldMeta>'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      fieldMeta[m[1]] = m[2];
    }
  } while (m);

  const viewStrMetaHandled = viewStr.replace(/<[^\>]*>/g, '');

  return [fieldMeta, viewStrMetaHandled];
};

const analizeSearch = function (
  briefView,
  listCategoryFieldsNotShown,
  listSearchFieldsBlackList,
  ownSearchStringFields,
  listSearchIDLookup,
  api,
  listActionButtons
) {
  let showSearchBox = false;
  let stringBoxFields = [];
  let ownSearchFields = [];
  let noMoreSearchArea = true;
  let hasArchive = false;
  let hasArray = false;
  let hasDate = false;
  let IDLookup = listSearchIDLookup;

  for (let field of briefView) {
    if (field.hidden) continue;
    if (listCategoryFieldsNotShown.includes(field.fieldName)) continue;
    if (field.picture) continue;
    if (listSearchFieldsBlackList.includes(field.fieldName)) {
      continue;
    }
    if (field.type === 'AngularSelector') {
      continue;
    }
    if (field.fieldName === '_id') {
      IDLookup = true;
      continue; // cannot text search based on "_id", but enable IDLookup
    }

    if (field.type === 'SchemaArray') {
      hasArray = true;
    }
    if (field.type === 'SchemaDate') {
      hasDate = true;
    }
    if (
      field.type == 'SchemaString' &&
      !ownSearchStringFields.includes(field.fieldName)
    ) {
      showSearchBox = true;
      stringBoxFields.push(field.displayname);
    } else {
      noMoreSearchArea = false;
      ownSearchFields.push(field);
    }
  }
  if (api.includes('A') && listActionButtons[3]) {
    noMoreSearchArea = false;
    hasArchive = true;
  }
  return {
    showSearchBox,
    stringBoxFields,
    noMoreSearchArea,
    ownSearchFields,
    IDLookup,
    hasArchive,
    hasArray,
    hasDate,
  };
};

const generateSourceFile = function (keyname, template, renderObj, outputDir) {
  let renderOptions = { root: ROOTDIR };
  let templateFile = basedirFile(template[0]);
  let output = generatedFile(outputDir, keyname, template[1]);
  let description = template[2];
  let options = template[3];

  //console.info('Generating %s for '%s'...', description, keyname);
  ejs.renderFile(templateFile, renderObj, renderOptions, (err, str) => {
    if (err) {
      logger.error(
        `ERROR! Error happens when generating ${description} for ${keyname}: ${err}`
      );
      return;
    }

    let beautified_str = str;
    let beautify_option = {
      indent_size: 2,
      space_in_empty_paren: true,
      preserve_newlines: false,
    };
    const extension = output.split('.').pop();
    switch (extension) {
      case 'ts':
      case 'js':
        beautified_str = js_beautify(str, beautify_option);
        break;
      case 'html':
        beautified_str = html_beautify(str, beautify_option);
        break;
      case 'css':
        beautified_str = css_beautify(str, beautify_option);
        break;
      default:
        beautified_str = str;
    }

    if (options == 'W') {
      write(output, beautified_str);
    } else if (options == 'A') {
      append(output, beautified_str);
    }
  });
};


const generateWidgetSource = function (widigetCategory, 
  widgetname, widgets, schemaName, schemaObj, dirname,
  componentType) {
  let component_file_name = `${widigetCategory}-widget-${widgetname}`;
  if (componentType && ['general', 'select', 'sub', 'association'].includes(componentType)) {
    component_file_name = `${widigetCategory}-${componentType}`;
  }
  let ComponentClassName = component_file_name.split('-').map(x=>Util.capitalizeFirst(x)).join('');
  schemaObj.ComponentClassName = ComponentClassName;
  schemaObj.component_file_name = component_file_name;

  let widgetDef;
  if (widgets) {
    widgetDef = widgets[widgetname];
    if (!widgetDef) {
      logger.error(
        `ERROR! widget definition for ${widgetname} is not given in wigets definition for ${widigetCategory}.`
      );
      _exit(1);
    }
  }
  schemaObj.widgetDef = widgetDef;

  const tsTemplate = `../templates/widgets/${widigetCategory}/${widgetname}/${widgetname}.component.ts`;
  const htmlTemplate = `../templates/widgets/${widigetCategory}/${widgetname}/${widgetname}.component.html`;
  const cssTemplate = `../templates/widgets/${widigetCategory}/${widgetname}/${widgetname}.component.css`;
  if (
    !fs.existsSync(basedirFile(tsTemplate)) ||
    !fs.existsSync(basedirFile(htmlTemplate)) ||
    !fs.existsSync(basedirFile(cssTemplate))
  ) {
    console.log(
      `Error! template files for ${widigetCategory} widget '${widgetname}' don't exist! Ignore...`
    );
    console.log(`    Expecting:${tsTemplate} and ${htmlTemplate}`);
    console.log(`       -- ${tsTemplate}`);
    console.log(`       -- ${htmlTemplate}`);
    console.log(`       -- ${cssTemplate}`);
    _exit(1);
  }
  const tsFile = [
    tsTemplate,
    `${component_file_name}.component.ts`,
    `${component_file_name} component file`,
    'W',
  ];
  const htmlFile = [
    htmlTemplate,
    `${component_file_name}.component.html`,
    `${component_file_name} component html file`,
    'W',
  ];
  const cssFile = [
    cssTemplate,
    `${component_file_name}.component.css`,
    `${component_file_name} component css file`,
    'W',
  ];
  generateSourceFile(schemaName, tsFile, schemaObj, dirname);
  generateSourceFile(schemaName, htmlFile, schemaObj, dirname);
  generateSourceFile(schemaName, cssFile, schemaObj, dirname);

  return [component_file_name, ComponentClassName];
}

const getPrimitiveField = function (fieldSchema) {
  let primitiveField = {
    type: fieldSchema.constructor.name,
    defaultValue: fieldSchema.options.default,

    jstype: undefined,
    numberMin: undefined,
    numberMax: undefined,
    maxlength: undefined,
    minlength: undefined,
    enumValues: undefined,
    ref: undefined,
    Ref: undefined,
    RefCamel: undefined,
    editor: false,
    mraType: '',
    textarea: false,
    mraEmailRecipient: false,
    flagDate: false,
    flagRef: false,
    flagPicture: false,
    aspectRatio: undefined,
    flagFile: false,
    flagSharable: false,
  };

  switch (primitiveField.type) {
    case 'SchemaString':
      primitiveField.jstype = 'string';
      //console.log('fieldSchema.validators', fieldSchema.validators)
      if (fieldSchema.validators)
        fieldSchema.validators.forEach((val) => {
          if (val.type == 'maxlength' && typeof val.maxlength === 'number')
            primitiveField.maxlength = val.maxlength;
          if (val.type == 'minlength' && typeof val.minlength === 'number')
            primitiveField.minlength = val.minlength;
          if (
            val.type == 'enum' &&
            Array.isArray(val.enumValues) &&
            val.enumValues.length > 0
          )
            primitiveField.enumValues = val.enumValues;
        });
      if (fieldSchema.options.editor == true) {
        primitiveField.editor = true;
      } else if (fieldSchema.options.textarea == true) {
        primitiveField.textarea = true;
      } else if (fieldSchema.options.mraEmailRecipient == true) {
        primitiveField.mraEmailRecipient = true;
      } else if (fieldSchema.options.mraType) {
        primitiveField.mraType = fieldSchema.options.mraType.toLowerCase();
        switch (primitiveField.mraType) {
          case 'picture':
            primitiveField.flagPicture = true;
            primitiveField.flagSharable = !!fieldSchema.options.mraSharable;
            primitiveField.aspectRatio = fieldSchema.options.aspectRatio;

            break;
          case 'file':
            primitiveField.flagFile = true;
            primitiveField.flagSharable = !!fieldSchema.options.mraSharable;

            break;
          case 'httpurl':
            break;
          default:
            logger.warning(
              `Unrecoganized mraType for SchemaString: ${fieldSchema.options.mraType}. Ignore...`
            );
        }
      }
      break;
    case 'SchemaBoolean':
      primitiveField.jstype = 'boolean';
      break;
    case 'SchemaNumber':
      primitiveField.jstype = 'number';

      if (fieldSchema.options.mraType) {
        primitiveField.mraType = fieldSchema.options.mraType.toLowerCase();
        switch (primitiveField.mraType) {
          case 'currency':
            break;
          default:
            logger.warning(
              `Unrecoganized mraType for SchemaNumber: ${fieldSchema.options.mraType}. Ignore...`
            );
        }
      }
      if (fieldSchema.validators)
        fieldSchema.validators.forEach((val) => {
          if (val.type == 'min' && typeof val.min === 'number')
            primitiveField.numberMin = val.min;
          if (val.type == 'max' && typeof val.max === 'number')
            primitiveField.numberMax = val.max;
        });
      break;
    case 'ObjectId':
      primitiveField.jstype = 'string';
      if (fieldSchema.options.ref) {
        primitiveField.RefCamel = Util.capitalizeFirst(fieldSchema.options.ref);
        primitiveField.ref = fieldSchema.options.ref.toLowerCase();
        primitiveField.Ref = Util.capitalizeFirst(primitiveField.ref);
        primitiveField.flagRef = true;
      }
      break;
    case 'SchemaDate':
      primitiveField.jstype = 'string';
      primitiveField.flagDate = true;
      if (fieldSchema.options.mraType) {
        primitiveField.mraType = fieldSchema.options.mraType; //https://angular.io/api/common/DatePipe
      } else {
        primitiveField.mraType = 'medium'; // 'medium': equivalent to 'MMM d, y, h:mm:ss a' (Jun 15, 2015, 9:03:01 AM).
      }
      break;
    default:
      logger.warning(`Field type ${primitiveField.type} is not recoganized...`);
  }

  return primitiveField;
};

const generateViewPicture = function (
  API,
  schemaName,
  viewStr,
  schema,
  validators,
  indexViewNames,
  selectors,
  fieldMeta,
  features
) {
  const [field2Meta, viewStrMetaHandled] = stripFieldMeta(viewStr);
  const [displayNames, viewStrDisplayNameHandled] = stripDisplayNames(
    viewStrMetaHandled
  );
  const [fieldHidden, viewStrPure] = stripFieldHidden(
    viewStrDisplayNameHandled
  );

  //process | in viewStr
  let fieldGroups = [];
  if (viewStrPure.indexOf('|') > -1) {
    let strGroups = viewStrPure.split('|');
    for (let str of strGroups) {
      let arr = str.match(/\S+/g);
      if (arr) {
        arr = arr.filter((x) => !fieldHidden[x]);
        if (arr.length > 0) {
          fieldGroups.push(arr);
        }
      }
    }
  }

  let viewDef = viewStrPure.replace(/\|/g, ' ').match(/\S+/g) || [];
  if (fieldGroups.length == 0) {
    //no grouping
    if (API === 'L') {
      fieldGroups.push(viewDef); // all elements as a group
    } else {
      for (let e of viewDef) {
        if (!fieldHidden[e]) {
          fieldGroups.push([e]); //each element as a group
        }
      }
    }
  }

  let view = [];
  let viewMap = {};

  let schFeatures = {
    hasDate: false,
    hasRef: false,
    hasEditor: false,
    hasRequiredMultiSelection: false,
    hasRequiredArray: false,
    hasRequiredMap: false,
    hasFileUpload: false,
    hasEmailing: false,

    hasMultiSelect: false,
  };

  for (let item of viewDef) {
    let showDisplayName = true;
  
    let hidden = !!fieldHidden[item];
    let usedMeta = field2Meta[item];

    let validatorArray;
    if (validators && Array.isArray(validators[item])) {
      validatorArray = validators[item];
    }

    let isIndexField = false;
    if (indexViewNames.includes(item)) isIndexField = true;

    let requiredField = false;

    let fieldDescription = '';
    let keyDescription = '';
    let valueDescription = '';
    let importantInfo = false;

    //for array
    let elementMultiSelect = false;
    let parentType;
    let mapKey;

    let sortable = false;

    let selector;
    let meta = {};

    let primitiveField = {
      mraType: '',
      editor: false,
      textarea: false,
      mraEmailRecipient: false,
      flagDate: false,
      flagRef: false,
      flagPicture: false,
      flagFile: false,
      flagSharable: false,
    };

    if (item !=='_id' && item in schema.paths) {
      if (usedMeta && fieldMeta && fieldMeta[usedMeta]) {
        meta = fieldMeta[usedMeta];
        let sel = meta.pipe || meta.selector;
        if (sel) {
          if (selectors.hasSelector(sel)) {
            selector = selectors.getSelector(sel);
            selector.usedCandidate(API);
          } else {
            logger.warning(
              `Selector ${sel} for Field ${item} is not defined. Skipped...`
            );
            continue;
          }
        }
      } else if (usedMeta) {
        logger.warning(
          `Field meta ${usedMeta} is not defined for field ${item}...`
        );
      }

      let fieldSchema = schema.paths[item];
      parentType = fieldSchema.constructor.name;
      requiredField = fieldSchema.originalRequiredValue === true ? true : false;
      //TODO: required could be a function
      defaultValue = fieldSchema.defaultValue || fieldSchema.options.default;
      if (fieldSchema.options.description) {
        //scope of map key defined
        fieldDescription = fieldSchema.options.description;
      }
      if (fieldSchema.options.keyDescription) {
        //scope of map key defined
        keyDescription = fieldSchema.options.keyDescription;
      }
      if (fieldSchema.options.valueDescription) {
        //scope of map key defined
        valueDescription = fieldSchema.options.valueDescription;
      }
      if (fieldSchema.options.important) {
        //scope of map key defined
        importantInfo = fieldSchema.options.important;
      }

      function setFeatures(schFeatures, primitiveField) {
        if (primitiveField.flagDate) schFeatures.hasDate = true;
        if (primitiveField.flagRef) schFeatures.hasRef = true;
        if (primitiveField.editor) schFeatures.hasEditor = true;
        if (primitiveField.flagPicture || primitiveField.flagFile)
          schFeatures.hasFileUpload = true;
        if (primitiveField.mraEmailRecipient) schFeatures.hasEmailing = true;
      }

      switch (parentType) {
        case 'SchemaString':
        case 'SchemaBoolean':
        case 'SchemaNumber':
        case 'ObjectId':
        case 'SchemaDate':
          primitiveField = getPrimitiveField(fieldSchema);
          setFeatures(schFeatures, primitiveField);

          sortable = true;
          if (
            primitiveField.editor ||
            primitiveField.flagPicture ||
            primitiveField.flagFile
          ) {
            sortable = false;
          }
          break;
        case 'SchemaArray':
          primitiveField = getPrimitiveField(fieldSchema.caster);
          setFeatures(schFeatures, primitiveField);

          //rewrite the default value for array
          let defaultInput = fieldSchema.options.default;
          if (Array.isArray(defaultInput)) {
            defaultValue = defaultInput;
          } else {
            defaultValue = undefined;
          }
          if (fieldSchema.options.elementunique && primitiveField.enumValues) {
            elementMultiSelect = true;
            schFeatures.hasMultiSelect = true;
            if (requiredField) {
              schFeatures.hasRequiredMultiSelection = true;
            }
          } else {
            if (requiredField) {
              schFeatures.hasRequiredArray = true;
            }
          }
          break;
        case 'SchemaMap':
        case 'Map':
          primitiveField = getPrimitiveField(fieldSchema['$__schemaType']);
          setFeatures(schFeatures, primitiveField);

          //rewrite the default value for array
          let defaultMap = fieldSchema.options.default;
          if (typeof defaultMap == 'object') {
            defaultValue = defaultMap;
          } else {
            defaultValue = undefined;
          }

          if (requiredField) {
            schFeatures.hasRequiredMap = true;
          }

          if (fieldSchema.options.key) {
            //scope of map key defined
            mapKey = fieldSchema.options.key;
          }
          break;
        default:
          logger.warning(
            `Field type ${primitiveField.type} is not recoganized for field ${item}...`
          );
      }

      if (parentType == 'SchemaMap') {
        parentType = 'Map';
      }
    } else if ( item === '_id') {
      parentType = 'SchemaString';
      primitiveField.jstype = 'string';
    } else if (item in schema.virtuals) {
      //Handle as a string
      parentType = 'SchemaString';
      primitiveField.jstype = 'string';
    } else if (usedMeta && selectors && selectors.hasSelector(usedMeta)) {
      // selector type:
      parentType = 'AngularSelector';
      selector = selectors.getSelector(usedMeta);
      selector.usedCandidate(API);

      showDisplayName = selector.showDisplayName;

    } else if (usedMeta) {
      logger.warning(
        `Selector ${usedMeta} for Field ${item} is not defined. Skipped...`
      );
      continue;
    } else {
      logger.warning(
        `Field ${item} is not defined in schema ${schemaName}. Skipped...`
      );
      continue;
    }

    const DN = displayNames[item] || Util.camelToDisplay(item);
    const dn = DN.toLowerCase();
    let fieldPicture = {
      fieldName: item,
      FieldName: Util.capitalizeFirst(item),
      displayName: DN,
      displayname: dn,
      showDisplayName,
      hidden,

      type: parentType,
      jstype: primitiveField.jstype,
      numberMin: primitiveField.numberMin,
      numberMax: primitiveField.numberMax,
      maxlength: primitiveField.maxlength,
      minlength: primitiveField.minlength,
      enumValues: primitiveField.enumValues,
      ref: primitiveField.ref,
      Ref: primitiveField.Ref,
      RefCamel: primitiveField.RefCamel,
      editor: primitiveField.editor, //rich format text
      mraType: primitiveField.mraType,
      textarea: primitiveField.textarea, // big text input
      mraEmailRecipient: primitiveField.mraEmailRecipient, // an email field an can receive email
      picture: primitiveField.flagPicture, // a picture field
      aspectRatio: primitiveField.aspectRatio,
      file: primitiveField.flagFile, // a file field
      sharable: primitiveField.flagSharable, // picture or file is sharable

      //TODO: required could be a function
      required: requiredField,
      defaultValue: defaultValue,
      description: fieldDescription,
      keyDescription,
      valueDescription,
      important: importantInfo,
      validators: validatorArray,

      isIndexField: isIndexField,
      sortable,

      //for array and map
      elementType: primitiveField.type,
      elementMultiSelect,
      //for map
      mapKey,

      //selector
      selector,
      meta,
    };

    view.push(fieldPicture);
    viewMap[item] = fieldPicture;
  }
  for (let f of view) {
    //handle Map Key
    if (f.mapKey) {
      //example: this.<anotherfield>.<subfield>
      fInfo = f.mapKey.split('.');
      if (fInfo.length <= 1) {
        console.log(
          '  -- mapKey for',
          f.fieldName,
          'is not in correct format.'
        );
        continue;
      }
      if (fInfo[0] != 'this') {
        console.log(
          '  -- mapKey for',
          f.fieldName,
          "doesn't refer to same schema field."
        );
        continue;
      }
      let refField = fInfo[1];
      if (refField in viewMap && viewMap[refField].type == 'ObjectId') {
        if (fInfo.length <= 2) {
          console.log(
            '  -- mapKey for',
            f.fieldName,
            'refers to a reference but no sub field given.'
          );
          continue;
        }
        f.mapKeyInfo = {
          type: 'ObjectId',
          refSchema: viewMap[refField].ref,
          refName: refField,
          refService: viewMap[refField].Ref + 'Service',
          refSubField: fInfo[2],
        };
        continue;
      }
      if (refField in viewMap && viewMap[refField].type == 'SchemaArray') {
        f.mapKeyInfo = { type: 'SchemaArray', name: refField };
        continue;
      }
      //console.log('   -- mapKey for', f.fieldName, '. No idea how to get the key from: ', refField);
    }
  }

  let viewGroups = [];
  for (let grp of fieldGroups) {
    let arr = grp.filter((x) => x in viewMap).map((x) => viewMap[x]);
    if (arr.length > 0) viewGroups.push(arr);
  }

  for (let feature in schFeatures) {
    if (schFeatures[feature]) {
      // if true
      features.usedCandidate(feature, API);
    }
  }

  return [viewGroups, view];
};

const setFieldProperty = function (view, fieldArr, include, property, value) {
  if (!fieldArr) return;
  let arr = fieldArr.slice(0);
  for (let f of view) {
    if (arr.includes(f.fieldName) === include) {
      f[property] = value;
    }
  }
};

const getAppendFields = function (viewArr, idx) {
  let fields = [];
  for (let i = idx + 1; i < viewArr.length; i ++) {
    let field = viewArr[i];
    if (field.meta.listShow === 'append') {
      fields.append(field);
    } else {
      break;
    }
  }
  return fields;
}

const getLoginUserPermission = function (permission) {
  let othersPermisson = permission['others'];
  if (typeof othersPermission !== 'string') {
    othersPermission = ''; //not permitted
  }
  let ownPermisson = permission['own'];
  if (typeof ownPermisson !== 'string') {
    ownPermisson = ''; //not permitted
  }
  return { others: othersPermission, own: ownPermisson };
};

const getPermission = function (authz, identity, schemaName) {
  let schemaAuthz;
  if (schemaName in authz) {
    //use the permission definition for the schema
    schemaAuthz = authz[schemaName];
  }
  let moduleAuthz;
  if ('module-authz' in authz) {
    //use the permission definition for the module
    moduleAuthz = authz['module-authz'];
  }

  let identityPermission;
  if (schemaAuthz && identity in schemaAuthz) {
    identityPermission = schemaAuthz[identity];
  } else if (moduleAuthz && identity in moduleAuthz) {
    identityPermission = moduleAuthz[identity];
  }

  if (identity == 'Anyone') {
    if (
      typeof identityPermission === 'string' ||
      typeof identityPermission === 'undefined'
    ) {
      return identityPermission;
    } else {
      return ''; //not permitted
    }
  } else if (identity == 'LoginUser') {
    if (
      typeof identityPermission === 'string' ||
      typeof identityPermission === 'undefined'
    ) {
      return { others: identityPermission, own: identityPermission };
    } else if (typeof identityPermission === 'object') {
      return getLoginUserPermission(identityPermission);
    } else {
      return { others: '', own: '' }; //not permitted
    }
  }
  return identityPermission;
};

const getSchemaPermission = function (schemaName, authz) {
  let anyonePermission = getPermission(authz, 'Anyone', schemaName);
  let permission = '';

  if (typeof anyonePermission == 'undefined') {
    permission = ''; //not permitted
  } else {
    permission = anyonePermission;
  }
  return permission;
};

const setListViewObj = function (schemaObj) {
  let clickItemAction = '';
  if (schemaObj.api.includes('R') && schemaObj.listToDetail === 'click') {
    clickItemAction = 'detail';
  }
  let cardHasLink = schemaObj.api.includes('R') && schemaObj.listToDetail === 'link';

  let canUpdate = schemaObj.api.includes('U');
  let canDelete = schemaObj.api.includes('D');
  let canArchive = schemaObj.api.includes('A');
  let canCheck = schemaObj.api.includes('D') || schemaObj.api.includes('A');

  let includeSubDetail = schemaObj.detailSubView.length != 0 && schemaObj.api.includes('R');

  let listViewObj = {
    clickItemAction,
    cardHasLink,
    cardHasSelect: false,
    includeSubDetail,

    canUpdate,
    canDelete,
    canArchive,
    canCheck,

    itemMultiSelect: true,
    majorUi: false,
  };
  schemaObj.listViewObj = listViewObj;
  return schemaObj;
};

// CLI
around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp();
  fn.apply(this, args);
  return { args: [], unknown: [] };
});

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true;
});

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown;

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp();
  }
});

let givenProgramName = process.argv[1];
let programName = path.basename(process.argv[1]);
if (programName === 'hg-angular-cli') {
  // called inside hg cli
  programName = 'hg angular-gen';
}

program
  .name(`${programName}`)
  .description('generate Angular UI components with given input schema')
  .version(VERSION, '    --version')
  .usage('[options] inputfile')
  .option(
    '-m, --module <module_name>',
    'module name generated for the given schemas. Default is schema file name.'
  )
  .option(
    '-a, --api <api_base>',
    'api base that will be used for rest calls. Default is "/api/<module_name>".'
  )
  .option('-o, --output <output_dir>', 'output directory of generated files')
  .option(
    '-v, --view <view name>',
    'admin, or public. Define the views to generate.'
  )
  .option(
    '-f, --framework <ui framework>',
    'Angular, React. Default is Angular.'
  )
  .option(
    '-d, --design <ui design>',
    'For Angular - Bootstrap, AngularMeterial, ngBootstrap. Default is Bootstrap'
  )
  .option(
    '-c, --conf',
    'Configuration for the given framework. -f (--framework) must be provided.'
  )
  .parse(process.argv);

if (!exit.exited) {
  main();
}

/**
 * Install an around function; AOP.
 */

function around(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) args[i] = arguments[i];
    return fn.call(this, old, args);
  };
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(msg, function (input) {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });
}

/**
 * Copy file from template directory.
 */

function copyTemplate(from, to) {
  write(to, fs.readFileSync(path.join(TEMPLATE_DIR, from), 'utf-8'));
}

/**
 * Copy multiple files from template directory.
 */

function copyTemplateMulti(fromDir, toDir, nameGlob) {
  fs.readdirSync(path.join(TEMPLATE_DIR, fromDir))
    .filter(minimatch.filter(nameGlob, { matchBase: true }))
    .forEach(function (name) {
      copyTemplate(path.join(fromDir, name), path.join(toDir, name));
    });
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {Function} fn
 */

function emptyDirectory(dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err;
    fn(!files || !files.length);
  });
}

/**
 * Graceful exit for async STDIO
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!draining--) _exit(code);
  }

  var draining = 0;
  var streams = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
  return process.platform === 'win32' && process.env._ === undefined;
}

/**
 * Load template file.
 */

function loadTemplate(name) {
  var contents = fs.readFileSync(
    path.join(__dirname, '..', 'templates', name + '.ejs'),
    'utf-8'
  );
  var locals = Object.create(null);

  function render() {
    return ejs.render(contents, locals, {
      escape: util.inspect,
    });
  }

  return {
    locals: locals,
    render: render,
  };
}

function getUiArch() {
  let uiFramework = program.framework || 'angular';
  uiFramework = uiFramework.toLowerCase();
  let uiDesign;
  switch (uiFramework) {
    case 'angular':
      uiDesign = program.design || 'bootstrap';
      break;
    case 'react':
      uiDesign = program.design || 'bootstrap';
      break;
    default:
  }
  uiDesign = uiDesign.toLowerCase();

  return [uiFramework, uiDesign];
}

function getConfiguration(uiFramework, files) {
  let conf = { styles: [], scripts: [] };
  for (let file of files) {
    file = path.resolve(file);
    let json = require(file);
    conf.styles = conf.styles.concat(json.styles);
    conf.scripts = conf.scripts.concat(json.scripts);
  }

  conf.styles = conf.styles.filter((x, i) => {
    return conf.styles.indexOf(x) === i;
  });
  conf.scripts = conf.scripts.filter((x, i) => {
    return conf.scripts.indexOf(x) === i;
  });

  console.log('');
  console.log(
    '*** Please include the following configuration to your project angular.json file:'
  );
  console.log('   -- architect.build.options.styles');
  console.log(JSON.stringify(conf.styles, null, 4));
  console.log('   -- architect.build.options.scripts');
  console.log(JSON.stringify(conf.scripts, null, 4));
}

/**
 * Generate sample configuration for given framework
 */
function configurationGen() {
  let [uiFramework, uiDesign] = getUiArch();
  let configFile;
  switch (uiFramework) {
    case 'angular':
      configFile = 'mdds.angular.json';
      break;
    default:
      console.error(
        `Configuration for framework ${uiFramework} is not supported.`
      );
      _exit(1);
  }
  // output directory
  let outputDir;
  if (!program.output) {
    if (fs.existsSync('src/app')) {
      outputDir = 'src/app';
      console.info(
        'NOTE: Output directory is not provided. Use "src/app" directory to check configuration...'
      );
    } else {
      outputDir = './';
      console.info(
        'NOTE: Output directory is not provided. Use the current to check configuration...'
      );
    }
  } else {
    outputDir = program.output;
    if (!fs.existsSync(outputDir)) {
      console.info(
        `Target project output directory ${outputDir} does not exist.`
      );
    }
  }

  console.log(`Checking mdds.angular.json under ${outputDir}...`);
  glob(outputDir + `/**/${configFile}`, {}, (err, files) => {
    if (err) {
      console.log(`Error when checking configuration: ${err.stack}`);
      _exit(1);
    }
    console.log(`-- The following configuration files are found: `, files);
    getConfiguration(uiFramework, files);
  });
}

/**
 * Main program.
 */

function main() {
  if (program.conf) {
    return configurationGen();
  }

  let inputFile = program.args.shift();
  if (!inputFile) {
    console.error('Argument error.');
    program.outputHelp();
    _exit(1);
  }
  if (!fs.existsSync(inputFile)) {
    console.error('Error: cannot find input file: ' + inputFile);
    _exit(1);
  }
  if (!inputFile.endsWith('.js')) {
    console.error(
      'Error: input file must be a .js file with Mongoose schema defined.'
    );
    _exit(1);
  }

  // ui framework
  let [uiFramework, uiDesign] = getUiArch();
  const moduleFeatures = getNewFeatures(uiFramework, uiDesign);

  let uiTemplateDir = path.join(ROOTDIR, 'ui', uiFramework, uiDesign);
  if (!fs.existsSync(uiTemplateDir)) {
    console.error(
      `Combination of UI Framework "${program.framework}" and UI Design "${program.design}" is not supported.`
    );
    _exit(1);
  }

  const funcs = {
    capitalizeFirst: Util.capitalizeFirst,
    getAppendFields,
  }

  let moduleName;
  if (!program.module) {
    let startPosition = inputFile.lastIndexOf(path.sep) + 1;
    moduleName = inputFile.substring(startPosition, inputFile.length - 3);
    console.info(
      'NOTE: Generated module name is not provided. Use "%s" from input file as module name...',
      moduleName
    );
  } else {
    moduleName = program.module;
    console.info('Using "%s" as generated module name...', moduleName);
  }
  let ModuleName = Util.capitalizeFirst(moduleName);
  let moduleNameCust = `${moduleName}-cust`;

  let apiBase;
  if (!program.api) {
    apiBase = 'api/' + moduleName;
    console.info(
      'NOTE: REST API base is not provided. Use "%s" as api base...',
      apiBase
    );
  } else {
    apiBase = program.api;
    console.info('Using "%s" as api base to call Rest APIs...', apiBase);
  }

  let generateView;
  if (!program.view) {
    generateView = 'admin';
  } else {
    generateView = program.view;
    if (generateView !== 'public') generateView = 'admin';
  }
  console.log('NOTE: generateView for ', generateView);

  // output directory
  let outputDir;
  if (!program.output) {
    outputDir = './';
    console.info(
      'NOTE: Output directory is not provided. Use the current directory for the output...'
    );
  } else {
    outputDir = program.output;
    if (!fs.existsSync(outputDir)) {
      //console.info('Creating output directory '%s'...', outputDir);
      mkdir('.', outputDir);
    }
  }
  let parentOutputDir = outputDir;
  outputDir = path.join(parentOutputDir, moduleName);
  outputDirCust = path.join(parentOutputDir, moduleNameCust);

  let subDirCust = path.join(parentOutputDir, moduleNameCust, 'cust');
  if (!fs.existsSync(subDirCust)) {
    //console.info('Creating component directory '%s'...', componentDir);
    mkdir('.', subDirCust);
  }
  let subDirExt = path.join(parentOutputDir, moduleNameCust, 'ext');
  if (!fs.existsSync(subDirExt)) {
    //console.info('Creating component directory '%s'...', componentDir);
    mkdir('.', subDirExt);
  }

  let relativePath = relative(__dirname, inputFile);
  let inputFileModule = relativePath.substring(0, relativePath.length - 3);
  let sysDef = require(inputFileModule);
  let schemas = sysDef.schemas;
  let config = sysDef.config;
  let authz = sysDef.authz;

  let patch = []; //extra fields patching to the schema
  if (sysDef.config && sysDef.config.patch) {
    patch = sysDef.config.patch;
  }

  let schemaMap = {};
  let validatorFields = [];
  let referenceSchemas = []; ////schemas that are referred
  let referenceMap = [];
  let defaultSchema;

  let dateFormat = 'MM/DD/YYYY';
  if (config && config.dateFormat) dateFormat = config.dateFormat;
  let timeFormat = 'hh:mm:ss';
  if (config && config.timeFormat) timeFormat = config.timeFormat;
  let fileServer;
  if (config && config.fileServer) fileServer = config.fileServer;
  let authRequired = false;

  let allSelectors = new Selectors();

  for (let name in schemas) {
    const schemaFeatures = getNewFeatures(uiFramework, uiDesign);

    let schemaDef = schemas[name];

    let schemaAnyonePermission = 'CRU'; // only check the three permissions which impact UI AuthGuard
    //D - delete, A - archive, E - Export, M - eMail: not considered here

    if (authz) {
      schemaAnyonePermission = getSchemaPermission(name, authz);
    }
    if (['C', 'R', 'U'].some((e) => !schemaAnyonePermission.includes(e))) {
      //anyone permission not include all of C, R, U
      authRequired = true; // need to include AuthGuard for certain pages.
    }

    if (typeof schemaDef !== 'object') {
      console.error(
        'Error: input file must export an object defining an object for each schema.'
      );
      _exit(1);
    }

    let views = schemaDef.views;
    let mongooseSchema = schemaDef.schema;
    let validators = schemaDef.validators;
    if (schemaDef.schema && schemaDef.schema.mddsValidators) {
      validators = schemaDef.schema.mddsValidators;
    }

    if (!mongooseSchema) {
      console.log('No schema defined. Ignore', name);
      continue;
    }

    if (mongooseSchema) {
      //patch fields
      const patchFields = schemaDef.patch || patch;
      for (const p of patchFields) {
        if (p in PredefinedPatchFields) {
          const f = {};
          f[p] = PredefinedPatchFields[p];
          mongooseSchema.add(f);
        } else {
          logger.warning(
            `ignore patching. Field is not a predefined patch fields: ${p}`
          );
        }
      }
    }

    let associations = schemaDef.associations || {};

    let detailType = 'normal';
    let detailTitle = '';

    let listTitle = '';
    let listRouterLink = '../../list';
    let disableListSearch = false;
    let listToDetail = 'click';
    let listSearchType = 'normal';
    let listSearchFieldsBlackList = [];
    let listSearchIDLookup = false;

    let defaultSortField, defaultSortOrder;
    let homeListNumber = 4;
    // object {listCategoryField:xxx, listCategoryShowMore: 'field...',
    //          listCategoryRef: 'xxxx', showCategoryCounts: true,
    //          showFieldInList: false, showEmptyCategory: false}
    let listCategories = [];
    let listSortFields; // sortable fields name inside the array. 'undefined' will use default sort fields.
    let listShowSubDetail = false;

    let detailActions = []; //extra buttons that trigger other pipelines
    let detailActionButtons = ['Edit', 'New', 'Delete', 'Archive'];
    let listActionButtons = ['Create', 'Delete', 'Send Email', 'Archive'];

    let detailRefBlackList = undefined;
    let detailRefName = {};

    let ownSearchStringFields = []; //list of strings that should have own search field in the search area
    let selectActionViewType = 'dropdown'; // used by list select widget

    // name of the submit buttons
    let editActionButtons = ['Submit', 'Cancel'];
    let createActionButtons = ['Submit', 'Cancel'];

    let listWidgets = Util.clone(defaultListWidgets);
    let listWidgetTypes = Util.clone(defaultListWidgetTypes);
    let listExtraWidgets = [];

    if (schemaDef.listWidgets) {
      logger.warning(`Schema ${name}: listWidgets is deprecated. Please configure your list widgets with mraUI.listWidgets.`)
    }
    if (schemaDef.mraUI) {
      const mraUI = schemaDef.mraUI;
      detailType = mraUI.detailType || 'normal'; //post, info, slide, term, ...

      if (mraUI.listTypeOnly) {
        logger.warning(`Schema ${name}: mraUI.listTypeOnly is deprecated. Please configure your list view widgets with listWidgets and listWidgetTypes.`)
      }
      if (mraUI.listType) {
        logger.warning(`Schema ${name}: mraUI.listType is deprecated. Please configure your list view widgets with listWidgets and listWidgetTypes.`)
      }
      if (mraUI.listSelectType) {
        logger.warning(`Schema ${name}: mraUI.listSelectType is deprecated. Please configure your list view widgets with listWidgets and listWidgetTypes.`)
      }

      switch (mraUI.listToDetail) {
        case 'none':
          listToDetail = 'none';
          break;
        case 'link':
          listToDetail = 'link';
          break;
        default:
          listToDetail = 'click';
      }
      if (mraUI.listWidgets) {
        listWidgets = Util.replaceProperties(mraUI.listWidgets, listWidgets);
      }
      if (mraUI.listWidgetTypes) {
        listWidgetTypes = Util.replaceProperties(mraUI.listWidgetTypes, listWidgetTypes);
      }
      listExtraWidgets = mraUI.listExtraWidgets || listExtraWidgets;

      listTitle = mraUI.listTitle;
      listRouterLink = mraUI.listRouterLink || listRouterLink;
      detailTitle = mraUI.detailTitle;
      disableListSearch = !!mraUI.disableListSearch;
      detailActionButtons = mraUI.detailActionButtons || detailActionButtons;
      listActionButtons = mraUI.listActionButtons || listActionButtons;
      detailRefBlackList = mraUI.detailRefBlackList || detailRefBlackList;
      detailRefName = mraUI.detailRefName || detailRefName;
      selectActionViewType = mraUI.selectActionViewType || selectActionViewType;
      listCategories = mraUI.listCategories || listCategories;
      listSortFields = mraUI.listSortFields;
      homeListNumber = mraUI.homeListNumber || homeListNumber;
      listSearchType = mraUI.listSearchType || listSearchType;
      listSearchFieldsBlackList =
        mraUI.listSearchFieldsBlackList || listSearchFieldsBlackList;
      if (typeof mraUI.listShowSubDetail === 'boolean') {
        listShowSubDetail = mraUI.listShowSubDetail;
      }
      if (typeof mraUI.listSearchIDLookup === 'boolean') {
        listSearchIDLookup = mraUI.listSearchIDLookup;
      }

      if (mraUI.defaultListSort) {
        const keys = Object.keys(mraUI.defaultListSort);
        if (keys.length > 0) {
          defaultSortField = keys[0];
          defaultSortOrder = mraUI.defaultListSort[defaultSortField];
        }
      }
      if (typeof mraUI.homeListNumber === 'number') {
        homeListNumber = mraUI.homeListNumber;
      }
      if (!!mraUI.detailActions) {
        detailActions = mraUI.detailActions;
      }
      if (!!mraUI.ownSearchStringFields) {
        ownSearchStringFields = mraUI.ownSearchStringFields;
      }

      editActionButtons = mraUI.editActionButtons || editActionButtons;
      createActionButtons = mraUI.createActionButtons || createActionButtons;
    }

    let embeddedViewOnly = schemaDef.embeddedViewOnly ? true : false;
    let viewName = schemaDef.name; //Display name on UI
    let api = schemaDef.api || 'LCRUDA'; //APIs exposed to front end ('LCRUDA')
    if (schemaDef.mraUI && schemaDef.mraUI.api) {
      api = schemaDef.mraUI.api;
    }
    api = api.toUpperCase();
    let singleRecord = schemaDef.singleRecord || false;
    if (singleRecord) {
      // api.replace('L', '').replace('D', ''); //not allow list and delete for single record
    }

    if ( ['myprefer'].includes(name.toLowerCase())) {
      listWidgets.general = {
        views: ['list', 'grid', 'table', 'sld', 'index', 'gallerySideIntro', 'galleryBottomTitle'],
      };
    }

    if (schemaDef.listSelectWidgets) {
      logger.warning(`listSelectWidgets is deprecated. Please configure your list select view widgets in listWidgets.select.`)
    }

    let detailWidgets = schemaDef.detailWidgets || []; //widgets: clean, sld, sel, ...
    detailWidgets = detailWidgets.map((x) => x);
    let DetailType = Util.capitalizeFirst(detailType);
    if (detailType !== 'normal' && !detailWidgets.includes(detailType)) {
      detailWidgets.push(detailType);
    }
    detailWidgets = detailWidgets.map((x) => {
      return [x, Util.capitalizeFirst(x)];
    });

    let editHintFields = [];
    if (schemaDef.mraBE) {
      editHintFields = schemaDef.mraBE.valueSearchFields || editHintFields;
    }

    let selectors = new Selectors();
    if (schemaDef.selectors) {
      selectors = new Selectors(schemaDef.selectors);
    }
    let fieldMeta = schemaDef.fieldMeta || {};

    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    if (typeof views !== 'object' || !Array.isArray(views)) {
      console.error(
        'Error: input file must export an object defining an array for each schema.'
      );
      _exit(1);
    }
    let schemaName = name.toLowerCase();
    //let model = mongoose.model(name, mongooseSchema, ); //model uses given name
    //console.log('----------------------------');
    //console.log(model);

    let componentDir = path.join(outputDir, schemaName);
    let componentDirCust = path.join(outputDirCust, 'base', schemaName);
    if (!fs.existsSync(componentDir)) {
      //console.info('Creating component directory '%s'...', componentDir);
      mkdir('.', componentDir);
    }
    if (!fs.existsSync(componentDirCust)) {
      //console.info('Creating component directory '%s'...', componentDir);
      mkdir('.', componentDirCust);
    }

    let subComponentDirs = [];
    if (api.includes('R') || api.includes('L')) {
      subComponentDirs.push(schemaName + '-detail');
    }
    if (api.includes('L')) {
      subComponentDirs.push(schemaName + '-list');
    }
    if (api.includes('C') || api.includes('U')) {
      subComponentDirs.push(schemaName + '-edit');
    }
    subComponentDirs.forEach((subComponent) => {
      let subComponentDir = path.join(componentDir, subComponent);
      if (!fs.existsSync(subComponentDir)) {
        //console.info('Creating sub-component directory '%s'...', subComponentDir);
        mkdir('.', subComponentDir);
      }
    });
    let indexViewNames = [];
    //briefView, detailView, CreateView, EditView, SearchView, indexView]
    /* 1. handle fields in indexView */
    let [indexViewGrp, indexView] = generateViewPicture(
      'I',
      name,
      views[5],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );
    for (let s of indexView) {
      indexViewNames.push(s.fieldName);
    }
    /* 2. handle fields in briefView */
    let [briefViewGrp, briefView] = generateViewPicture(
      'L',
      name,
      views[0],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );
    setFieldProperty(briefView, listSortFields, false, 'sortable', false); // if include is "false", set to "false"
    setFieldProperty(briefView, editHintFields, true, 'hint', true); // if include is "true", set to "true"

    /* 3. handle fields in detailView */
    let [detailViewGrp, detailView] = generateViewPicture(
      'R',
      name,
      views[1],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );

    /* 4. handle fields in createView */
    let [createViewGrp, createView] = generateViewPicture(
      'C',
      name,
      views[2],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );
    setFieldProperty(createView, editHintFields, true, 'hint', true); // if include is "true", set to "true"

    /* 5. handle fields in editView */
    let [editViewGrp, editView] = generateViewPicture(
      'U',
      name,
      views[3],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );
    setFieldProperty(editView, editHintFields, true, 'hint', true); // if include is "true", set to "true"

    /* 6. handle fields in searchView */
    let [searchViewGrp, searchView] = generateViewPicture(
      'S',
      name,
      views[4],
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );

    let schemaHasEditorU = false; // editor update view
    let schemaHasFileUploadU = false;
    for (let sAPI of ['L', 'R', 'C', 'U']) {
      if (api.includes(sAPI)) {
        selectors.used(sAPI);
        schemaFeatures.used(sAPI);
      }
    }

    let sFeatures = schemaFeatures.getUsedFeatures();
    for (let f in sFeatures) {
      if (sFeatures[f]) {
        moduleFeatures.usedConfirmed(f);
      }
    }

    let [stripFieldMetaDetail, viewStrMetaHandledDetail] = stripFieldMeta(
      views[1]
    );
    let [displayNamesDetail, viewStrDisplayHandledDetail] = stripDisplayNames(
      viewStrMetaHandledDetail
    );
    let [fieldHiddenDetail, viewStrPureDetail] = stripFieldHidden(
      viewStrDisplayHandledDetail
    );

    let [stripFieldMetaBrief, viewStrMetaHandledBrief] = stripFieldMeta(
      views[0]
    );
    let [displayNamesBrief, viewStrDisplayHandledBrief] = stripDisplayNames(
      viewStrMetaHandledBrief
    );
    let [fieldHiddenBrief, viewStrPureBrief] = stripFieldHidden(
      viewStrDisplayHandledBrief
    );

    let briefFields = viewStrPureBrief.replace(/\|/g, ' ').match(/\S+/g) || [];
    let briefNoHiddenFields = briefFields.filter((x) => !fieldHiddenBrief[x]);

    let detailViewGroups = viewStrPureDetail.split('|');
    detailViewGroups = detailViewGroups.map((detailViewGrp) => {
      let arr = detailViewGrp.match(/\S+/g) || [];
      arr = arr.filter(
        (x) => !briefNoHiddenFields.includes(x) && !fieldHiddenDetail[x]
      );
      arr = arr.map((x) => {
        let y = x;
        if (displayNamesDetail[x]) {
          y = `${y}[${displayNamesDetail[x]}]`;
        }
        if (stripFieldMetaDetail[x]) {
          y = `${y}<${stripFieldMetaDetail[x]}>`;
        }
        return y;
      });
      return arr.join(' ');
    });
    // detailViewGroups = detailViewGroups.filter( detailViewGrp => !!detailViewGrp.trim());
    let detailSubViewStr = detailViewGroups.join('|');

    /* 6. handle fields in detailSubView */
    let [detailSubViewGrp, detailSubView] = generateViewPicture(
      'R',
      name,
      detailSubViewStr,
      mongooseSchema,
      validators,
      indexViewNames,
      selectors,
      fieldMeta,
      schemaFeatures
    );

    let compositeEditView = [];
    if (api.includes('U')) {
      compositeEditView = editView.slice();
    }
    if (api.includes('C')) {
      let editFields = compositeEditView.map((x) => x.fieldName);
      createView.forEach(function (x) {
        if (!editFields.includes(x.fieldName)) compositeEditView.push(x);
      });
    }

    // Edit + brief + detailed view
    let compositeEditBriefView = compositeEditView.slice(); //do reference include for this view.
    if (api.includes('L')) {
      let compositeEditFields = compositeEditBriefView.map((x) => x.fieldName);
      briefView.forEach(function (x) {
        if (!compositeEditFields.includes(x.fieldName))
          compositeEditBriefView.push(x);
      });
    }
    if (api.includes('R')) {
      //also add the 'Detailed' view for links on reference
      let compositeEditFields = compositeEditBriefView.map((x) => x.fieldName);
      detailView.forEach(function (x) {
        if (!compositeEditFields.includes(x.fieldName))
          compositeEditBriefView.push(x);
      });
    }

    let SchemaName = Util.capitalizeFirst(schemaName);
    let SchemaCamelName = viewName ? viewName : Util.capitalizeFirst(name);
    let schemaCamelName = Util.lowerFirst(SchemaCamelName);
    let schemaHasValidator = false;

    compositeEditView.forEach(function (x) {
      //validators:
      if (x.validators) {
        schemaHasValidator = true;
        validatorFields.push({
          Directive: ModuleName + SchemaName + 'Directive' + x.FieldName,
          schemaName: schemaName,
        });
      }
    });

    let mapFieldsRef = [];
    compositeEditBriefView.forEach(function (x) {
      //Ref fields: for edit create view, or search in list view
      if (x.ref) {
        referenceSchemas.push(x.ref);
        let isArray = x.type == 'SchemaArray';
        referenceMap.push(
          JSON.stringify([
            schemaName,
            SchemaName,
            x.fieldName,
            x.ref,
            x.Ref,
            SchemaCamelName,
            x.RefCamel,
            isArray,
            api,
          ])
        );
      }
      if (x.mapKeyInfo && x.mapKeyInfo.type == 'ObjectId') {
        mapFieldsRef.push([x.mapKeyInfo.refSchema, x.mapKeyInfo.refService]);
      }
    });

    let defaultSortFieldDisplay;
    if (defaultSortField) {
      let fieldFound = false;
      for (let i = 0; i < briefView.length; i++) {
        if (briefView[i].fieldName === defaultSortField) {
          defaultSortFieldDisplay = briefView[i].displayName;
          fieldFound = true;
          break;
        }
      }
      if (!fieldFound) {
        console.log(
          'Sorting field is not found in view definition. Ignore... ',
          defaultSortField
        );
        defaultSortField = undefined;
      }
    }

    const tempListCategories = [];
    for (let cate of listCategories) {
      let fieldFound = false;
      for (let i = 0; i < briefView.length; i++) {
        if (briefView[i].fieldName === cate.listCategoryField) {
          cate.listCategoryRef = briefView[i].ref;
          fieldFound = true;
          break;
        }
      }
      if (!fieldFound) {
        console.log(
          'listCategoryField field is not found in view definition. Ignore... ',
          cate.listCategoryField
        );
        continue;
      }
      tempListCategories.push(cate);
    }
    listCategories = tempListCategories;
    const listCategoryFields = listCategories.map((x) => x.listCategoryField);
    const listCategoryFieldsNotShown = listCategories
      .filter((x) => !x.showFieldInList)
      .map((x) => x.listCategoryField);

    allSelectors.combineSelectors(selectors);

    const selectorsObj = {};
    selectors.selectors.forEach((x) => {
      selectorsObj[x.name] = x;
    });

    const searchBarObj = analizeSearch(
      briefView,
      listCategoryFieldsNotShown,
      listSearchFieldsBlackList,
      ownSearchStringFields,
      listSearchIDLookup,
      api,
      listActionButtons
    );

    let schemaObj = {
      name: name,
      moduleName: moduleName,
      ModuleName: ModuleName,
      schemaName: schemaName,
      SchemaName: SchemaName,
      SchemaCamelName: SchemaCamelName,
      schemaCamelName: schemaCamelName,
      apiBase: apiBase,
      briefView: briefView,
      detailView: detailView,
      createView: createView,
      editView: editView,
      searchView: searchView,
      indexView: indexView,
      detailSubView: detailSubView,

      briefViewGrp: briefViewGrp,
      detailViewGrp: detailViewGrp,
      createViewGrp: createViewGrp,
      editViewGrp: editViewGrp,
      searchViewGrp: searchViewGrp,
      indexViewGrp: indexViewGrp,
      detailSubViewGrp: detailSubViewGrp,

      compositeEditView,
      compositeEditBriefView,
      mapFieldsRef,

      sFeatures,

      componentDir,
      componentDirCust,
      dateFormat,
      timeFormat,
      schemaHasValidator,
      permission: schemaAnyonePermission,
      embeddedViewOnly,

      listRouterLink,
      listTitle, //array of grid, table, list
      listToDetail, // link, click, none
      disableListSearch,
      listActionButtons,
      listCategories,
      listCategoryFields,
      listCategoryFieldsNotShown,
      defaultSortField,
      defaultSortFieldDisplay,
      defaultSortOrder,
      listWidgets,
      listWidgetTypes,
      listExtraWidgets,
      listSearchType,
      listSearchFieldsBlackList,
      searchBarObj,
      listViewObj: {}, //listViewObj = {cardHasLink,canUpdate,canDelete,canArchive,canCheck,}
      listShowSubDetail,
      allListViewWidgets: [],
      knownListWidgets: [],
      listViewProperties: {}, // properties

      detailType, // normal, post, info, slide, term...
      DetailType,
      detailActionButtons,
      detailRefName,
      detailTitle,
      detailActions,
      detailRefBlackList,
      detailWidgets,

      editHintFields,
      ownSearchStringFields,

      editActionButtons,
      createActionButtons,

      homeListNumber,

      selectActionViewType,
      generateView,

      api,

      selectors: selectorsObj,
      fieldMeta,

      refApi: {},
      refListSelectType: {},
      associations, // in the parent schema that needs to show associations
      associationFor: [], //in the association schema itself

      singleRecord,

      fileServer: fileServer,

      FIELD_NUMBER_FOR_SELECT_VIEW,

      uiFramework,
      uiDesign,

      funcs,
    };
    //console.log('======schemaObj', schemaObj);
    schemaObj = setListViewObj(schemaObj);

    if (!defaultSchema) defaultSchema = schemaName;
    schemaMap[schemaName] = schemaObj;
  } /*End of schema name loop*/

  referenceSchemas = referenceSchemas.filter((value, index, self) => {
    return self.indexOf(value) === index;
  }); //de-duplicate
  let referenceObjSchemas = referenceSchemas.map((value) => {
    return { ref: value, Ref: Util.capitalizeFirst(value) };
  });
  referenceMap = referenceMap.filter((value, index, self) => {
    return self.indexOf(value) === index;
  }); //de-duplicate
  referenceMap = referenceMap.map((value) => {
    return JSON.parse(value); //restore the array: [schemaName, SchemaName, x.fieldName, x.ref, x.Ref, SchemaCamelName, x.RefCamel, isArray, api]
  });
  referenceMap = referenceMap.map((value) => {
    let schemaObj = schemaMap[value[3]]; // myself
    value.push(schemaObj.api);
    //[schemaName, SchemaName, x.fieldName, x.ref, x.Ref, SchemaCamelName, x.RefCamel, isArray, api, refApi, ref Name]
    let refObj = schemaMap[value[0]]; // the one who referenced me

    value.push(refObj.name); //its name

    refObj.refApi[value[3]] = schemaObj.api;
    refObj.refListSelectType[value[3]] = ['-list-select', 'ListSelect'];
    value[5] = refObj.SchemaCamelName;
    if (refObj.name in schemaObj.detailRefName) {
      value[5] = schemaObj.detailRefName[refObj.name];
    }

    return value;
  });

  for (let schemaName in schemaMap) {
    let schemaObj = schemaMap[schemaName];

    if (referenceSchemas.indexOf(schemaName) != -1) {
      schemaObj.referred = true;

      for (let obj of referenceObjSchemas) {
        if (obj.ref == schemaName) {
          const properties = [
            'api',
            'listWidgets', 'listWidgetTypes',
          ];

          for (let p of properties) {
            obj[p] = schemaObj[p];
          }
        }
      }
    } else {
      schemaObj.referred = false;
    }
    schemaObj.referredBy = referenceMap.filter((x) => x[3] == schemaName);
    //Each item has [who (it), Who, which field, refer to me, Me, WhoCamel, MeCamel, isArray, its api, my api, its name] format

    let assoRoutes = [];

    for (let ref of schemaObj.referredBy) {
      let refApi = ref[8];
      let refname = ref[0]; //ref all in lower case
      let refName = ref[10]; //defined schema name
      if (
        schemaObj.detailRefBlackList &&
        schemaObj.detailRefBlackList.includes(refName)
      ) {
        continue;
      }
      if (!refApi.includes('L')) {
        continue;
      }
      if (!schemaObj.associations[refName]) {
        continue;
      }
      // refer to which schema(lower case), the schema's formal schema name, the asso filed,
      //    the Label text triggering the asso, my schemaName (lower case)
      //    the assoField schema (lower case), the assoField SchemaName
      let [assoField, assoText] = schemaObj.associations[refName];
      let assoRecord = [
        refname,
        refName,
        assoField,
        assoText,
        schemaObj.schemaName,
      ];

      let assocationSchema = schemaMap[ref[0]];

      let fieldFound = false;
      for (let field of assocationSchema.detailView) {
        //find out the schema of the association schema
        if (field.fieldName === assoField && field.ref) {
          assoRecord.push(field.ref);
          assoRecord.push(field.Ref);
          fieldFound = true;
        }
      }
      if (!fieldFound) {
        logger.warning(
          `Association schema ${ref[0]} doesn't have ref field ${assoField}...`
        );
        assoRecord.push(null);
        assoRecord.push(null);
        continue;
      }
      assoRecord.push(schemaObj.listWidgetTypes.association);

      assoRoutes.push(assoRecord);
      // Put to the association schema object
      assocationSchema.associationFor.push(assoRecord);
    }

    schemaObj.assoRoutes = assoRoutes;
  }

  const mFeatures = moduleFeatures.getUsedFeatures();
  const fImports = moduleFeatures.getImports();
  const sImports = allSelectors.getImports();

  // merge imports from features and selectors
  let mergedModules = fImports.modules.concat(sImports.modules);
  mergedModules = mergedModules.filter(
    (x, idx) => mergedModules.indexOf(x) === idx
  );
  let mergedImports = fImports.imports;
  for (let p in sImports.imports) {
    if (mergedImports[p]) {
      mergedImports[p] = mergedImports[p].concat(sImports.imports[p]);
    } else {
      mergedImports[p] = sImports.imports[p];
    }
  }
  for (let p in mergedImports) {
    mergedImports[p] = mergedImports[p].filter(
      (x, idx) => mergedImports[p].indexOf(x) === idx
    );
  }
  const mImports = {
    imports: mergedImports,
    modules: mergedModules,
  };

  console.log('uiFramework: ', uiFramework, ' uiDesign: ', uiDesign);

  let renderObj = {
    moduleName,
    ModuleName,
    apiBase,
    schemaMap,
    defaultSchema,
    validatorFields,
    referenceSchemas: referenceObjSchemas, //schemas that are referred

    mFeatures,
    mImports,

    dateFormat,
    timeFormat,
    authRequired,
    fileServer,

    generateView,

    uiFramework,
    uiDesign,
    VERSION,

    funcs,
  };

  for (let key in schemaMap) {
    let schemaObj = renderObj.schemaMap[key];
    let componentDir = schemaObj.componentDir;
    let componentDirCust = schemaObj.componentDirCust;
    let schemaName = schemaObj.schemaName;

    generateSourceFile(
      schemaName,
      templates.schemaBaseService,
      schemaObj,
      componentDir
    );
    generateSourceFile(
      schemaName,
      templates.schemaService,
      schemaObj,
      componentDir
    );
    generateSourceFile(
      schemaName,
      templates.schemaComponent,
      schemaObj,
      componentDir
    );

    if (schemaObj.api.includes('L')) {
      let allListViewWidgets = [];
      let knownListWidgets = [];
      let knownListViewWidgets = [];

      let subComponentDir = path.join(componentDir, schemaName + '-list');

      let listViewObjBk = Util.clone(schemaObj.listViewObj);
      schemaObj.listViewObj = setListViewProperties('general', schemaObj.listViewObj);
      let widget = schemaObj.listWidgetTypes.general;
      let [component_file_name, ComponentClassName] =
        generateWidgetSource('list', widget, schemaObj.listWidgets, schemaName, schemaObj, subComponentDir, 'general');
      knownListWidgets.push([component_file_name, ComponentClassName]);
      allListViewWidgets = allListViewWidgets.concat(schemaObj.listWidgets[widget].views);
      schemaObj.listViewObj = listViewObjBk;

      if (referenceSchemas.indexOf(schemaName) != -1) {
        //Don't search ref any more on select view. Disable more search area
        const noMoreSearchArea = schemaObj.searchBarObj.noMoreSearchArea;
        schemaObj.searchBarObj.noMoreSearchArea = true;

        listViewObjBk = Util.clone(schemaObj.listViewObj);
        schemaObj.listViewObj = setListViewProperties('select', schemaObj.listViewObj);
        widget = schemaObj.listWidgetTypes.select;
        [component_file_name, ComponentClassName] =
          generateWidgetSource('list', widget, schemaObj.listWidgets, schemaName, schemaObj, subComponentDir, 'select');
        knownListWidgets.push([component_file_name, ComponentClassName]);
        allListViewWidgets = allListViewWidgets.concat(schemaObj.listWidgets[widget].views);
        schemaObj.listViewObj = listViewObjBk;

        // restore noMoreSearchArea
        schemaObj.searchBarObj.noMoreSearchArea = noMoreSearchArea;
      }
      if (schemaObj.sFeatures.hasRef) {
        listViewObjBk = Util.clone(schemaObj.listViewObj);
        schemaObj.listViewObj = setListViewProperties('sub', schemaObj.listViewObj);
        widget = schemaObj.listWidgetTypes.sub;
        [component_file_name, ComponentClassName] =
          generateWidgetSource('list', widget, schemaObj.listWidgets, schemaName, schemaObj, subComponentDir, 'sub');
        knownListWidgets.push([component_file_name, ComponentClassName]);
        allListViewWidgets = allListViewWidgets.concat(schemaObj.listWidgets[widget].views);
        schemaObj.listViewObj = listViewObjBk;

        if (schemaObj.associationFor.length > 0) {
          listViewObjBk = Util.clone(schemaObj.listViewObj);
          schemaObj.listViewObj = setListViewProperties('association', schemaObj.listViewObj);
          widget = schemaObj.listWidgetTypes.association;
          [component_file_name, ComponentClassName] =
            generateWidgetSource('list', widget, schemaObj.listWidgets, schemaName, schemaObj, subComponentDir, 'association');
          knownListWidgets.push([component_file_name, ComponentClassName]);
          allListViewWidgets = allListViewWidgets.concat(schemaObj.listWidgets[widget].views);
          schemaObj.listViewObj = listViewObjBk;
        }
      }
      for (let widget of schemaObj.listExtraWidgets) {
        if (knownListWidgets.includes(widget)) {
          continue;
        }
        [component_file_name, ComponentClassName] =
          generateWidgetSource('list', widget, schemaObj.listWidgets, schemaName, schemaObj, subComponentDir);
        knownListWidgets.push([component_file_name, ComponentClassName]);
        allListViewWidgets = allListViewWidgets.concat(schemaObj.listWidgets[widget].views);
      }

      allListViewWidgets = allListViewWidgets.filter((x, idx) => allListViewWidgets.indexOf(x) === idx);
      for (let widget of allListViewWidgets) {
        [component_file_name, ComponentClassName] =
          generateWidgetSource('list-view', widget, null, schemaName, schemaObj, subComponentDir);
        knownListViewWidgets.push([component_file_name, ComponentClassName]);
      }

      let listViewProperties = {};
      for (let w of allListViewWidgets) {
        let property = {
          mobile: false,
        };
        let jsonFile = basedirFile(`../templates/widgets/list-view/${w}/property.json`);
        if (fs.existsSync(jsonFile)) {
          let rawdata = fs.readFileSync(jsonFile);
          let parsedData = JSON.parse(rawdata);

          property.mobile = parsedData.mobile;
        } else {
          logger.warning(`${jsonFile} file does not exist for widget ${w}.`)
        }

        listViewProperties[w] = property;
      }
      knownListWidgets = knownListWidgets.filter((x, idx) => knownListWidgets.indexOf(x) === idx);
      schemaObj.knownListViewWidgets = knownListViewWidgets;
      schemaObj.knownListWidgets = knownListWidgets;
      schemaObj.listViewProperties = listViewProperties;
      
      generateSourceFile(
        schemaName,
        templates.schemaListComponent,
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaListCustComponent,
        schemaObj,
        componentDirCust
      );
      generateSourceFile(
        schemaName,
        templates.schemaListComponentCss,
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaListViewComponent,
        schemaObj,
        subComponentDir
      );
    }

    if (schemaObj.api.includes('R')) {
      subComponentDir = path.join(componentDir, schemaName + '-detail');

      generateSourceFile(
        schemaName,
        templates.schemaDetail[0], // component.ts
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaDetail[3], // cust.component.ts
        schemaObj,
        componentDirCust
      );
      generateSourceFile(
        schemaName,
        templates.schemaDetail[1], // html
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaDetail[2], // css
        schemaObj,
        subComponentDir
      );

      for (const widget of schemaObj.detailWidgets) {
        const widgetname = widget[0];
        const detailTs = [
          `../templates/widgets/detail/${widgetname}/${widgetname}.component.ts`,
          `detail-widget-${widgetname}.component.ts`,
          `detail widget ${widgetname} component file`,
          'W',
        ];
        const detailHtml = [
          `../templates/widgets/detail/${widgetname}/${widgetname}.component.html`,
          `detail-widget-${widgetname}.component.html`,
          `detail widget ${widgetname} component html file`,
          'W',
        ];
        const detailCss = [
          `../templates/widgets/detail/${widgetname}/${widgetname}.component.css`,
          `detail-widget-${widgetname}.component.css`,
          `detail widget ${widgetname} component css file`,
          'W',
        ];
        generateSourceFile(schemaName, detailTs, schemaObj, subComponentDir);
        generateSourceFile(schemaName, detailHtml, schemaObj, subComponentDir);
        generateSourceFile(schemaName, detailCss, schemaObj, subComponentDir);
      }

      if (referenceSchemas.indexOf(schemaName) != -1) {
        //referenced by others, provide select component
        generateSourceFile(
          schemaName,
          templates.schemaDetailSelComponent,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailSelComponentHtml,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailPopComponent,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailPopComponentHtml,
          schemaObj,
          subComponentDir
        );
      }
      if (schemaObj.api.includes('L') && schemaObj.listViewObj.includeSubDetail) {
        generateSourceFile(
          schemaName,
          templates.schemaDetailSubComponent,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailSubComponentHtml,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailSubComponentCss,
          schemaObj,
          subComponentDir
        );
      }
      if (schemaObj.assoRoutes.length > 0) {
        // has association defined
        generateSourceFile(
          schemaName,
          templates.schemaDetailAssoComponent,
          schemaObj,
          subComponentDir
        );
        generateSourceFile(
          schemaName,
          templates.schemaDetailAssoComponentHtml,
          schemaObj,
          subComponentDir
        );
      }
    }

    if (schemaObj.api.includes('R') || schemaObj.api.includes('L')) {
      //genearte filed show component
      subComponentDir = path.join(componentDir, schemaName + '-detail');
      generateSourceFile(
        schemaName,
        templates.schemaDetail[2],
        schemaObj,
        subComponentDir
      ); //generate css. reuse the normal one
      generateSourceFile(
        schemaName,
        templates.schemaDetailShowFieldCompoment,
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaDetailShowFieldCompomentHtml,
        schemaObj,
        subComponentDir
      );
    }

    if (schemaObj.api.includes('U') || schemaObj.api.includes('C')) {
      subComponentDir = path.join(componentDir, schemaName + '-edit');
      generateSourceFile(
        schemaName,
        templates.schemaEditComponent,
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaEditCustComponent,
        schemaObj,
        componentDirCust
      );
      generateSourceFile(
        schemaName,
        templates.schemaEditComponentHtml,
        schemaObj,
        subComponentDir
      );
      generateSourceFile(
        schemaName,
        templates.schemaEditComponentCss,
        schemaObj,
        subComponentDir
      );
    }
  } /*End of generate source for each schema*/

  //console.log('***renderObj', renderObj);
  //generateSourceFile(null, templates.mraCss, {}, parentOutputDir);
  generateSourceFile(moduleName, templates.angular, renderObj, outputDir);
  generateSourceFile(moduleName, templates.conf, renderObj, outputDirCust);
  generateSourceFile(
    moduleName,
    templates.tokensValue,
    renderObj,
    outputDirCust
  );

  generateSourceFile(moduleName, templates.mainModule, renderObj, outputDir);
  generateSourceFile(
    moduleName,
    templates.mainCoreModule,
    renderObj,
    outputDir
  );
  generateSourceFile(
    moduleName,
    templates.mainCustModule,
    renderObj,
    outputDirCust
  );
  generateSourceFile(
    moduleName,
    templates.mainExtModule,
    renderObj,
    outputDirCust
  );
  generateSourceFile(moduleName, templates.mainComponent, renderObj, outputDir);
  generateSourceFile(
    moduleName,
    templates.mainComponentHtml,
    renderObj,
    outputDir
  );
  generateSourceFile(
    moduleName,
    templates.mainComponentCss,
    renderObj,
    outputDir
  );
  generateSourceFile(moduleName, templates.tokens, renderObj, outputDir);

  generateSourceFile(moduleName, templates.routingModule, renderObj, outputDir);
  generateSourceFile(
    moduleName,
    templates.routingCoreModule,
    renderObj,
    outputDir
  );
  generateSourceFile(
    moduleName,
    templates.routingCorePath,
    renderObj,
    outputDir
  );
  generateSourceFile(
    moduleName,
    templates.routingCustPath,
    renderObj,
    outputDirCust
  );

  if (
    mFeatures.hasDate ||
    mFeatures.hasRequiredMultiSelection ||
    mFeatures.hasRequiredArray ||
    mFeatures.hasRequiredMap
  ) {
    generateSourceFile(
      moduleName,
      templates.mainDirective,
      renderObj,
      outputDir
    );
  }



  console.log();
  const [wNum, eNum] = logger.statistics();
  if (wNum + eNum > 0) {
    console.log('+++ total warnings:', wNum);
    console.log('+++ total errors:', eNum);
  } else {
    console.log('+++ Done!');
  }
  console.log();
  console.log(
    `+++ Configure your ${uiFramework} application for the generated UI? Please run:`
  );
  console.log(` ${programName} -c -f ${uiFramework} -o ${parentOutputDir}`);
  console.log();
  return;

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath);
    } else {
      confirm('destination is not empty, continue? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy();
          createApplication(appName, destinationPath);
        } else {
          console.error('aborting');
          exit(1);
        }
      });
    }
  });
}

/**
 * Make the given dir relative to base.
 *
 * @param {string} base
 * @param {string} dir
 */

function mkdir(base, dir) {
  var loc = path.join(base, dir);

  console.log('   \x1b[36mcreate\x1b[0m : ' + loc + path.sep);
  mkdirp.sync(loc, MODE_0755);
}

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption(originalName, newName) {
  return function (val) {
    logger.warning(
      util.format('option "%s" has been renamed to "%s"', originalName, newName)
    );
    return val;
  };
}

/**
 * echo str > file.
 *
 * @param {String} file
 * @param {String} str
 */

function write(file, str, mode) {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 });
  console.log('   \x1b[36mcreate\x1b[0m : ' + file);
}
/**
 * echo str >> file.
 *
 * @param {String} file
 * @param {String} str
 */

function append(file, str, mode) {
  let fileMode = { mode: mode || MODE_0666 };
  let date = new Date();

  if (!fs.existsSync(file)) {
    fs.appendFileSync(file, str, fileMode);
    console.log('   \x1b[36mcreate\x1b[0m : ' + file);
  } else {
    let result = '';
    console.log('   \x1b[36mappend to\x1b[0m : ' + file);
    console.log(
      '      IMPORTANT! Please check content and merge if necessary.'
    );
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
        return;
      }
      result = data.replace(/\/\*>>>(.*\n)+.*<<<\*\/\n/g, '');
      fs.writeFileSync(file, result, fileMode);
      fs.appendFileSync(
        file,
        '/*>>> Please check this recent updates and merge with existing ones***\n',
        fileMode
      );
      fs.appendFileSync(file, '**Date: ' + date + '\n\n', fileMode);
      fs.appendFileSync(file, str, fileMode);
      fs.appendFileSync(file, '**** End of recent updates.<<<*/\n', fileMode);
    });
  }
}
