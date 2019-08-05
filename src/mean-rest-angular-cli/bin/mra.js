#!/usr/bin/env node
/*
 * Script to create angular UI and service code based on Mongoose schema. This is the command line
 * interface for mean-rest-angular package
 * 
 */

const FIELD_NUMBER_FOR_SELECT_VIEW = 4;

var ejs = require('ejs');
var mongoose = require('mongoose');

var fs = require('fs')
var path = require('path');
var relative = require('relative');
var program = require('commander');

var minimatch = require('minimatch')
var mkdirp = require('mkdirp')
var readline = require('readline')
var sortedObject = require('sorted-object')
var util = require('util')

var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)
var TEMPLATE_DIR = path.join(__dirname, '..', 'templates')
var VERSION = require('../package').version

var _exit = process.exit

// Re-assign process.exit because of commander
process.exit = exit

var views_collection = {}; //views in [schema, briefView, detailView, CreateView, EditView, SearchView, IndexView] format
var model_collection = {};

var basedirFile = function(relativePath) {
	return path.join(__dirname, relativePath);
}
var generatedFile = function(outputDir, prefix, outputFile) {
	if (!prefix) prefix = ""; 
	if(prefix !== "" && !outputFile.startsWith('.')) prefix += '-';
	return path.join(outputDir, prefix + outputFile);
}
var capitalizeFirst = function(str) {
	return str.charAt(0).toUpperCase() + str.substr(1);
}

var lowerFirst = function(str) {
	return str.charAt(0).toLowerCase() + str.substr(1);
}

var camelToDisplay = function (str) {
    // insert a space before all caps
    words = [
        'At', 'Around', 'By', 'After', 'Along', 'For', 
        'From', 'Of', 'On', 'To', 'With', 'Without',
        'And', 'Nor', 'But', 'Or', 'Yet', 'So',
        'A', 'An', 'The'
    ];
    let  arr = str.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').match(/\S+/g);
    arr = arr.map(x=>{
        let y = capitalizeFirst(x);
        if (words.includes(y)) y = lowerFirst(y);
        return y;
    });
    return capitalizeFirst(arr.join(' '));
}

var templates = {
	//key:[template_file, output_file_suffix, description, write_options]
  //write_options: W: write, A: append
  conf: ["../templates/conf.ts", ".conf.ts", "module conf file", 'A'],
        
  mainModule: ["../templates/main.module.ts", ".module.ts", "main module file", 'W'],
  mainComponent: ["../templates/main.component.ts", ".component.ts", "main component file", 'W'],
  mainComponentHtml: ["../templates/main.component.html", ".component.html", "main component html file", 'W'],
  mainComponentCss: ["../templates/main.component.css", ".component.css", "main component css file", 'W'],
  mainDirective: ["../templates/main.directive.ts", ".directive.ts", "main directive file", 'W'],
  tokens: ["../templates/tokens.ts", ".tokens.ts", "module token file", 'W'],
	
  routingModule: ["../templates/routing.module.ts", "routing.module.ts", "routing module file", 'W'],
  routingPath: ["../templates/routing.path.ts", "routing.path.ts", "routing path file", 'W'],
	
	
  schemaBaseService: ["../templates/schema.base.service.ts", ".base.service.ts", "base service file", 'W'],
  schemaService: ["../templates/schema.service.ts", ".service.ts", "service file", 'W'],
  schemaComponent: ["../templates/schema.component.ts", ".component.ts", "component file", 'W'],
  schemaListComponent: ["../templates/schema-list.component.ts", "list.component.ts", "list component file", 'W'],
  schemaListComponentHtml: ["../templates/schema-list.component.html", "list.component.html", "list component html file", 'W'],
  schemaListComponentCss: ["../templates/schema-list.component.css", "list.component.css", "list component css file", 'W'],
  schemaSelectComponent: ["../templates/schema-select.component.ts", "select.component.ts", "select component file", 'W'],
  schemaSelectComponentHtml: ["../templates/schema-select.component.html", "select.component.html", "select component html file", 'W'],
  schemaListSubComponent: ["../templates/schema-list-sub.component.ts", "list-sub.component.ts", "list-sub component file", 'W'],
  schemaListSubComponentHtml: ["../templates/schema-list-sub.component.html", "list-sub.component.html", "list-sub component html file", 'W'],
  schemaListAssoComponent: ["../templates/schema-list-asso.component.ts", "list-asso.component.ts", "list-asso component file", 'W'],
  schemaListAssoComponentHtml: ["../templates/schema-list-asso.component.html", "list-asso.component.html", "list-asso component html file", 'W'],
  schemaListActSelComponent: ["../templates/schema-list-act-s.component.ts", "list-act-sel.component.ts", "list-act-sel component file", 'W'],
  schemaListActSelComponentHtml: ["../templates/schema-list-act-s.component.html", "list-act-sel.component.html", "list-act-sel component html file", 'W'],
  schemaListActSldComponent: ["../templates/schema-list-act-sld.component.ts", "list-act-sld.component.ts", "list-act-sld component file", 'W'],
  schemaListActSldComponentHtml: ["../templates/schema-list-act-sld.component.html", "list-act-sld.component.html", "list-act-sld component html file", 'W'],
  schemaListHomeComponent: ["../templates/schema-list-act-h.component.ts", "list-home.component.ts", "list-home component file", 'W'],
  schemaListHomeComponentHtml: ["../templates/schema-list-act-h.component.html", "list-home.component.html", "list-home component html file", 'W'],

  schemaDetail: {
    'normal': [
      ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file", 'W'],
      ["../templates/schema-detail.component.html", "detail.component.html", "detail component html file", 'W'],
      ["../templates/schema-detail.component.css", "detail.component.css", "detail component css file", 'W'],
    ],
    'post': [
      ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file", 'W'],
      ["../templates/schema-detail-post.component.html", "detail.component.html", "detail component html file", 'W'],
      ["../templates/schema-detail-post.component.css", "detail.component.css", "detail component css file", 'W'],
    ],
    'info': [
      ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file", 'W'],
      ["../templates/schema-detail-info.component.html", "detail.component.html", "detail component html file", 'W'],
      ["../templates/schema-detail-info.component.css", "detail.component.css", "detail component css file", 'W'],
    ],
    'slide': [
      ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file", 'W'],
      ["../templates/schema-detail-slide.component.html", "detail.component.html", "detail component html file", 'W'],
      ["../templates/schema-detail-slide.component.css", "detail.component.css", "detail component css file", 'W'],
    ],
    'term': [
      ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file", 'W'],
      ["../templates/schema-detail-term.component.html", "detail.component.html", "detail component html file", 'W'],
      ["../templates/schema-detail-term.component.css", "detail.component.css", "detail component css file", 'W'],
    ],
  },
  schemaDetailAssoComponent: ["../templates/schema-detail-asso.component.ts", "detail-asso.component.ts", "detail association component file", 'W'],
  schemaDetailAssoComponentHtml: ["../templates/schema-detail-asso.component.html", "detail-asso.component.html", "detail association component html file", 'W'],

  schemaDetailSelComponent: ["../templates/schema-detail-sel.component.ts", "detail-sel.component.ts", "detail select component file", 'W'],
  schemaDetailSelComponentHtml: ["../templates/schema-detail-sel.component.html", "detail-sel.component.html", "detail select component html file", 'W'],
  schemaDetailPopComponent: ["../templates/schema-detail-pop.component.ts", "detail-pop.component.ts", "detail pop component file", 'W'],
  schemaDetailPopComponentHtml: ["../templates/schema-detail-pop.component.html", "detail-pop.component.html", "detail pop component html file", 'W'],
  schemaDetailSubComponent: ["../templates/schema-detail-sub.component.ts", "detail-sub.component.ts", "detail sub component file", 'W'],
  schemaDetailSubComponentHtml: ["../templates/schema-detail-sub.component.html", "detail-sub.component.html", "detail sub component html file", 'W'],
	
  schemaEditComponent: ["../templates/schema-edit.component.ts", "edit.component.ts", "edit component file", 'W'],
  schemaEditComponentHtml: ["../templates/schema-edit.component.html", "edit.component.html", "edit component html file", 'W'],
  schemaEditComponentCss: ["../templates/schema-edit.component.css", "edit.component.css", "edit component css file", 'W'],
  mraCss: ["../templates/mean-express-angular.css", "mean-express-angular.css", "mean-rest-angular css file", 'W'],
}

const PredefinedPatchFields = {
  muser_id: { type: String, index: true},
  mmodule_name: { type: String, index: true},
}

var generateSourceFile = function(keyname, template, renderObj, outputDir) {
	let renderOptions = {};
	let templateFile = basedirFile(template[0]);
	let output = generatedFile(outputDir, keyname, template[1]);
	let description = template[2];
	let options = template[3];

	//console.info('Generating %s for "%s"...', description, keyname);
  	ejs.renderFile(templateFile, renderObj, renderOptions, (err, str) => {
		if (err) {
			console.error("ERROR! Error happens when generating %s for %s: %s", description, keyname, err);
			return
		}
		if (options == 'W') {
			write(output, str);
		} else if (options == 'A') {
		  append(output, str);
		}
	});
}

var getPrimitiveField = function(fieldSchema) {
    let type;
    let jstype;
    let defaultValue;
    let numberMin, numberMax;
    let maxlength, minlength;
    let enumValues;
    let ref, Ref, RefCamel;
    let editor = false;
    let requiredField = false;

    let flagDate = false;
    let flagRef = false;
    let flagEditor = false;
    let flagPicture = false;
    let flagFile = false;
    let flagSharable = false;

    type = fieldSchema.constructor.name;

    switch(type) {
        case "SchemaString":
            jstype = "string";
            if ( typeof(defaultValue) !== 'undefined') {
                defaultValue = "'" + defaultValue + "'";
            }
            //console.log("fieldSchema.validators", fieldSchema.validators)
            if (fieldSchema.validators)
                fieldSchema.validators.forEach((val) => {
                    if (val.type == 'maxlength' && typeof val.maxlength === 'number') maxlength = val.maxlength;
                    if (val.type == 'minlength' && typeof val.minlength === 'number') minlength = val.minlength;
                    if (val.type == 'enum' && Array.isArray(val.enumValues) && val.enumValues.length > 0) enumValues = val.enumValues;
                });
            if (fieldSchema.options.editor == true) {
                editor = true;
                flagEditor = true;
            }	else if (fieldSchema.options.mraType === 'picture') {
              flagPicture = true;
              flagSharable = !!fieldSchema.options.mraSharable;
            } else if (fieldSchema.options.mraType === 'file' ) {
              flagFile = true;
              flagSharable = !!fieldSchema.options.mraSharable;
            }
            break;
        case "SchemaBoolean":
            jstype = "boolean";
            break;
        case "SchemaNumber":
            jstype = "number";
            if (fieldSchema.validators)
                fieldSchema.validators.forEach((val) => {
                    if (val.type == 'min' && typeof val.min === 'number') numberMin = val.min;
                    if (val.type == 'max' && typeof val.max === 'number') numberMax = val.max;
                });
            break;
        case "ObjectId":
            jstype = "string";
            if (fieldSchema.options.ref) {
                RefCamel = capitalizeFirst(fieldSchema.options.ref)
                ref = fieldSchema.options.ref.toLowerCase();
                Ref = capitalizeFirst(ref);
                flagRef = true;
            }
            break;
        case "SchemaDate":
            jstype = "string";
            flagDate = true;
            break;
        default:
            console.warn("Warning: Field type", type, "is not recoganized...");
            ;
    }

    return [type, jstype, numberMin, numberMax, maxlength, minlength,  enumValues, 
            ref, Ref, RefCamel, editor,
            flagDate, flagRef, flagEditor, flagPicture, flagFile, flagSharable];
}

var processField = function(x) {
  let hidden = false;
  let field = x;
  let matches = x.match(/\((.*?)\)/);
  if (matches) {
    hidden = true;
    field = matches[1];
  }
  return [field, hidden];
}

var processFieldGroups = function(fieldGroups) {
  //remove surrounding ()
  for (let arr of fieldGroups) {
    arr = arr.map(x=>{
      let [f, hidden] = processField(x);
      if (hidden) return '';
      return f;
    });
    arr = arr.filter(x=>{
      return !!x;  //remove empty fields
    })
  }
  
  fieldGroups.filter(x=>{
    return x.length > 0; //remove empty groups
  })
  
  return fieldGroups;
}
var generateViewPicture = function(schemaName, viewStr, schema, validators, indexViewNames) {
    const displayNames = {};
    const re = /([^\s]+)\[([^\]]*)\]/g;  // handle "field[field displayName]"
    const s = viewStr;
    let m;
    do {
      m = re.exec(s);
      if (m) {
          displayNames[m[1]] = m[2];
      }
    } while (m);

    const viewStrDisplayNameHandled = viewStr.replace(/\[[^\]]*\]/g, ' ');

    //process | in viewStr
    let fieldGroups = [];
    if (viewStrDisplayNameHandled.indexOf('|') > -1) {
        let strGroups = viewStrDisplayNameHandled.split('|');
        for (let str of strGroups) {
            let arr = str.match(/\S+/g);
            if (arr) {
              fieldGroups.push(arr);
            }
        }
    }

    let viewDef = viewStrDisplayNameHandled.replace(/\|/g, ' ').match(/\S+/g) || [];
    if (fieldGroups.length == 0) { //no grouping
        for (let e of viewDef) {
            fieldGroups.push([e]); //each element as a group
        }
    }

    fieldGroups = processFieldGroups(fieldGroups);
    
    let view = [];
    let viewMap = {};
  	let hasDate = false;
	  let hasRef = false;
    let hasEditor = false;
    let hasRequiredMultiSelection = false;
    let hasRequiredArray = false;
    let hasRequiredMap = false;
    let hasFileUpload = false;

	  for (let item of viewDef) {
	    let hidden = false;
	    [item, hidden] = processField(item)
	    
      let validatorArray;
      if (validators && Array.isArray(validators[item])) {
          validatorArray = validators[item];
      }

      let isIndexField = false;
      if ( indexViewNames.includes(item) ) isIndexField = true;

      let type;
      let jstype;
      let defaultValue;
      let numberMin, numberMax;
      let maxlength, minlength;
      let enumValues;
      let ref, Ref, RefCamel;
      let editor = false;
      let requiredField = false;
      let fieldDescription = false;

      let flagDate = false;
      let flagRef = false;
      let flagEditor = false;
      let flagPicture = false;
      let flagFile = false;
      let flagSharable = false;
  
      //for array
      let elementUnique = false;
      let elementType;
      let mapKey;

      let sortable = false;

  		if (item in schema.paths) {
        let fieldSchema = schema.paths[item];
        type = fieldSchema.constructor.name;
        requiredField = fieldSchema.originalRequiredValue === true? true:false;
        //TODO: required could be a function
        defaultValue = fieldSchema.defaultValue;
        if (fieldSchema.options.description) {//scope of map key defined
          fieldDescription = fieldSchema.options.description;
        }
  
  			switch(type) {
          case "SchemaString":
          case "SchemaBoolean":
          case "SchemaNumber":
          case "ObjectId":
          case "SchemaDate":
              [type,  jstype,  numberMin,  numberMax,  numberMax,  minlength,  enumValues, 
              ref, Ref, RefCamel, editor,
              flagDate, flagRef, flagEditor, flagPicture, flagFile, flagSharable]
                  = getPrimitiveField(fieldSchema);
              if (flagDate) hasDate = true;
              if (flagRef) hasRef = true;
              if (flagEditor) hasEditor = true;
              if (flagPicture || flagFile) hasFileUpload = true;

              sortable = true;
              if (flagEditor || flagPicture || flagFile) sortable = false;
              break;
          case "SchemaArray":
              [elementType,  jstype,  numberMin,  numberMax,  numberMax,  minlength,  enumValues, 
              ref, Ref, RefCamel, editor,
              flagDate, flagRef, flagEditor, flagPicture, flagFile, flagSharable]
                  = getPrimitiveField(fieldSchema.caster);
              //rewrite the default value for array
              let defaultInput = fieldSchema.options.default;
              if (Array.isArray(defaultInput)) {
                defaultValue = defaultInput;
              } else {
                defaultValue = undefined;
              }
              if (fieldSchema.options.elementunique) {
                elementUnique = true;
                if (requiredField) {
                  hasRequiredMultiSelection = true;
                }
              } else {
                if (requiredField) {
                  hasRequiredArray = true;
                }
              }

              //let fs = fieldSchema;
              //console.log(fs);
              //console.log("===fieldSchema.options.default:", fieldSchema.options.default);
              // console.log("===caster.validators:", fs.caster.validators);
              // console.log("===casterConstructor:", fs.casterConstructor);
              // console.log("===validators:", fs.validators);
              break;
          case "Map":
              [elementType,  jstype,  numberMin,  numberMax,  maxlength,  minlength,  enumValues, 
              ref, Ref, RefCamel, editor,
              flagDate, flagRef, flagEditor, flagPicture, flagFile, flagSharable]
                  = getPrimitiveField(fieldSchema['$__schemaType']);
              //console.log("getPrimitiveField", getPrimitiveField(fieldSchema['$__schemaType']));
              //rewrite the default value for array
              let defaultMap = fieldSchema.options.default;
              if (typeof defaultMap == 'object') {
                defaultValue = defaultMap;
              } else {
                defaultValue = undefined;
              }

              if (requiredField) {
                hasRequiredMap = true;
              }
              
              if (fieldSchema.options.key) {//scope of map key defined
                mapKey = fieldSchema.options.key;
              }
              //let fs = fieldSchema;
              //console.log(fieldSchema);
              //console.log("===fieldSchema['$__schemaType']:", fieldSchema['$__schemaType']);
              // console.log("===caster.validators:", fs.caster.validators);
              // console.log("===casterConstructor:", fs.casterConstructor);
              // console.log("===validators:", fs.validators);
              //console.log("***schema map: ", fieldSchema)
              break;
          default:
              console.warn("Warning: Field type", type, "is not recoganized...");
              ;
  			}
  		} else if (item in schema.virtuals) {
          //Handle as a string
          type = 'SchemaString';
          jstype = 'string';
  
      } else {
          console.warn("Warning: Field", item, "is not defined in schema", schemaName + ". Skipped...");
          continue;
      }
      let fieldPicture = {
          fieldName: item,
          FieldName: capitalizeFirst(item),
          displayName: displayNames[item] || camelToDisplay(item),
          hidden: hidden,
          type: type,
          jstype: jstype,
          ref: ref,
          Ref: Ref,
          RefCamel: RefCamel,
          editor: editor,
          picture: flagPicture, // a picture field
          file: flagFile, // a file field
          sharable: flagSharable, // picture or file is sharable
          //TODO: required could be a function
          required: requiredField,
          defaultValue: defaultValue,
          description: fieldDescription,
          numberMin: numberMin,
          numberMax: numberMax,
          maxlength: maxlength,
          minlength: minlength,
          enumValues: enumValues,
          validators: validatorArray,

          isIndexField: isIndexField,
          sortable: sortable,

          //for array and map
          elementType: elementType,
          elementUnique: elementUnique,
          //for map
          mapKey: mapKey,
      }

      if (type == 'Map') {
        //console.log("***schema", schema);
        //console.log("***Map", fieldPicture);
      }
      if (fieldPicture.fieldName === 'student') {
        //console.log(fieldPicture.fieldName, fieldPicture);
      }
      view.push(fieldPicture);
      viewMap[item] = fieldPicture;
    }
    for (let f of view) { //handle Map Key
      if (f.mapKey) {
        //example: this.<anotherfield>.<subfield>
        fInfo = f.mapKey.split('.');
        if (fInfo.length <= 1) {
          console.log("  -- mapKey for", f.fieldName, "is not in correct format.");
          continue;
        }
        if (fInfo[0] != 'this') {
          console.log("  -- mapKey for", f.fieldName, "doesn't refer to same schema field.");
          continue;
        }
        let refField = fInfo[1];
        if (refField in viewMap && viewMap[refField].type == 'ObjectId') {
          if (fInfo.length <= 2) {
            console.log("  -- mapKey for", f.fieldName, "refers to a reference but no sub field given.");
            continue;
          }
          f.mapKeyInfo = {
                  type: 'ObjectId', 
                  refSchema: viewMap[refField].ref, 
                  refName: refField, 
                  refService: viewMap[refField].Ref + 'Service', 
                  refSubField: fInfo[2]
          };
          continue;
        }
        if (refField in viewMap && viewMap[refField].type == 'SchemaArray') {
          f.mapKeyInfo = {type: 'SchemaArray',  name: refField};
          continue;
        }
        //console.log("   -- mapKey for", f.fieldName, ". No idea how to get the key from: ", refField);
      }
    }

    let viewGroups = [];
    for (let grp of fieldGroups) {
        let arr = grp.filter(x=>x in viewMap).map(x=>viewMap[x]);
        if (arr.length > 0) viewGroups.push(arr);
    }
  	return [viewGroups, view, hasDate, hasRef, hasEditor, 
  	        hasRequiredMultiSelection, hasRequiredArray, hasRequiredMap, hasFileUpload];
}

const getLoginUserPermission = function(permission) {
  let othersPermisson = permission['others'];
  if (typeof othersPermission !== 'string') {
    othersPermission = ''; //not permitted
  }
  let ownPermisson = permission['own'];
  if (typeof ownPermisson !== 'string') {
    ownPermisson = ''; //not permitted
  }
  return {"others": othersPermission, "own": ownPermisson}
}

const getPermission = function(authz, identity, schemaName) {
  let schemaAuthz; 
  if (schemaName in authz) {
    //use the permission definition for the schema
    schemaAuthz = authz[schemaName];
  } 
  let moduleAuthz; 
  if ("module-authz" in authz) {
    //use the permission definition for the module
    moduleAuthz = authz["module-authz"];
  }
  
  let identityPermission;
  if (schemaAuthz && identity in schemaAuthz) {
    identityPermission = schemaAuthz[identity];
  } else if (moduleAuthz && identity in moduleAuthz) {
    identityPermission = moduleAuthz[identity];
  }

  if (identity == "Anyone") {
    if (typeof identityPermission === 'string' || typeof identityPermission === 'undefined') {
      return identityPermission;
    } else {
      return ""; //not permitted
    }
  } else if (identity == "LoginUser") {
    if (typeof identityPermission === 'string' || typeof identityPermission === 'undefined') {
      return {"others": identityPermission, "own": identityPermission};
    } else if (typeof identityPermission === 'object') {
      return getLoginUserPermission(identityPermission); 
    } else {
      return {"others": '', "own": ''}; //not permitted
    }
  }
  return identityPermission;
}

const getSchemaPermission = function(schemaName, authz) {

    let anyonePermission = getPermission(authz, 'Anyone', schemaName);
    let permission = "";

    if (typeof anyonePermission == 'undefined') {
      permission = ""; //not permitted
    } else {
      permission = anyonePermission;
    }
    return permission;
}
  

// CLI
around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp()
  fn.apply(this, args)
  return { args: [], unknown: [] }
})

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true
})

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})

program
  .name('mra')
  .version(VERSION, '    --version')
  .usage('[options] input')
  .option('-m, --module <module_name>', 'module name generated for the given schemas. Default is schema file name.')
  .option('-a, --api <api_base>', 'api base that will be used for rest calls. Default is "/api/<module_name>".')
  .option('-o, --output <output_dir>', 'output directory of generated files')
  .option('-f, --force', 'force to overwrite existing files')
  .option('-v, --view <view name>', 'admin, or public. Define the views to generate.')
  .parse(process.argv)

if (!exit.exited) {
  main()
}

/**
 * Install an around function; AOP.
 */

function around (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

function before (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm (msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}

/**
 * Copy file from template directory.
 */

function copyTemplate (from, to) {
  write(to, fs.readFileSync(path.join(TEMPLATE_DIR, from), 'utf-8'))
}

/**
 * Copy multiple files from template directory.
 */

function copyTemplateMulti (fromDir, toDir, nameGlob) {
  fs.readdirSync(path.join(TEMPLATE_DIR, fromDir))
    .filter(minimatch.filter(nameGlob, { matchBase: true }))
    .forEach(function (name) {
      copyTemplate(path.join(fromDir, name), path.join(toDir, name))
    })
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {Function} fn
 */

function emptyDirectory (dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}


/**
 * Graceful exit for async STDIO
 */

function exit (code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done () {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })
  
  done()
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd () {
  return process.platform === 'win32' &&
    process.env._ === undefined
}

/**
 * Load template file.
 */

function loadTemplate (name) {
  var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')
  var locals = Object.create(null)

  function render () {
    return ejs.render(contents, locals, {
      escape: util.inspect
    })
  }

  return {
    locals: locals,
    render: render
  }
}

/**
 * Main program.
 */

function main() {
  let inputFile = program.args.shift()
  if (!inputFile)  {
	  console.error("Argument error.")
	  program.outputHelp();
	  _exit(1);
  }
  if (!fs.existsSync(inputFile)) {
	  console.error("Error: cannot find input file: " + inputFile)
	  _exit(1);
  }
  if (!inputFile.endsWith(".js")) {
	  console.error("Error: input file must be a .js file with Mongoose schema defined.");
	  _exit(1);
  }
  
  let moduleName;
  if (!program.module) {
	  let startPosition = inputFile.lastIndexOf(path.sep) + 1;
	  moduleName = inputFile.substring(startPosition, inputFile.length-3);
	  console.info('NOTE: Generated module name is not provided. Use "%s" from input file as module name...', moduleName);
  } else {
	  moduleName = program.module;
	  console.info('Using "%s" as generated module name...', moduleName);
  }
  let ModuleName = capitalizeFirst(moduleName);

  let apiBase;
  if (!program.api) {
	  apiBase = "api/" + moduleName;
	  console.info('NOTE: REST API base is not provided. Use "%s" as api base...', apiBase);
  } else {
	  apiBase = program.api;
	  console.info('Using "%s" as api base to call Rest APIs...', apiBase);
  }

  let generateView;
  if (!program.view) {
	  generateView = "admin";
  } else {
    generateView = program.view;
    if (generateView !== 'public') generateView = 'admin';
  }
  console.log('Note: generateView for ', generateView);

  // output directory
  let outputDir;
  if (!program.output) {
	  outputDir = "./"
	  console.info("NOTE: Output directory is not provided. Use the current directory for the output...");
  } else {
	  outputDir = program.output;
	  if(!fs.existsSync(outputDir)) {
		  //console.info('Creating output directory "%s"...', outputDir);
		  mkdir(".", outputDir)
	  }
  }
  let parentOutputDir = outputDir;
  outputDir = path.join(outputDir, moduleName);

  let overWrite = false;
  if (program.force) overWrite = true;
  
  let relativePath = relative(__dirname, inputFile);
  let inputFileModule = relativePath.substring(0, relativePath.length-3);
  let sysDef = require(inputFileModule);
  let schemas = sysDef.schemas;
  let config = sysDef.config;
  let authz = sysDef.authz;
  
  let patch = []; //extra fields patching to the schema
  if (sysDef.config && sysDef.config.patch){
    patch = sysDef.config.patch
  }

  let schemaMap = {};
  let validatorFields = [];
  let referenceSchemas = []; ////schemas that are referred
  let referenceMap = [];
  let defaultSchema;
  let hasDate = false;
  let hasRef = false;
  let hasEditor = false;
  let hasRequiredMultiSelection = false;
  let hasRequiredArray = false;
  let hasRequiredMap = false;
  let hasFileUpload = false;
  let dateFormat = 'MM/DD/YYYY';
  if (config && config.dateFormat) dateFormat = config.dateFormat;
  let timeFormat = 'hh:mm:ss';
  if (config && config.timeFormat) timeFormat = config.timeFormat;
  let fileServer;
  if (config && config.fileServer) fileServer = config.fileServer;
  let authRequired = false;
  
  for (let name in schemas) {
    let schemaDef = schemas[name];
    
    let schemaAnyonePermission = "CRUD";
    if (authz) {
      schemaAnyonePermission = getSchemaPermission(name, authz);
    }
    if (["C", "R", "U", "D"].some(e=>!schemaAnyonePermission.includes(e))) { //not crud
      authRequired = true;
    }

  	if (typeof schemaDef !== 'object') {
  		console.error("Error: input file must export an object defining an object for each schema.");
  		_exit(1);
  	}
  
  	let views = schemaDef.views
    let mongooseSchema = schemaDef.schema;
    let validators = schemaDef.schema.mddsValidators || schemaDef.validators;

    if (!mongooseSchema) {
      console.log('No schema defined. Ignore', name)
      continue
    }
    
    if (mongooseSchema) { //patch fields
      const patchFields = schemaDef.patch || patch;
      for (const p of patchFields) {
        if (p in PredefinedPatchFields) {
          const f = {};
          f[p] = PredefinedPatchFields[p];
          mongooseSchema.add(f);
        } else {
          console.warn("Warning: ignore patching. Field is not a predefined patch fields:", p);
        }
      }
    }

    let associations = schemaDef.associations || {};

    let detailType = 'normal';
    let detailTitle = '';
    let listType = 'list';
    let listTitle = '';
    let disableListSearch = false;
    let listToDetail = 'click';
    let defaultSortField, defaultSortOrder;
    let homeListNumber = 4;
    let listCategoryField = '';
    let listCategoryShowMore = '';

    let detailActions = []; //extra buttons that trigger other pipelines
    let detailActionButtons = ['Edit', 'New', 'Delete'];
    let listActionButtons = ['Create', 'Delete'];
    let detailRefBlackList = undefined;
    let detailRefName = {};

    let selectActionViewType = 'dropdown';

    if (schemaDef.mraUI) {
      let mraUI = schemaDef.mraUI;
      switch (mraUI.detailType) {
        case 'post':
          detailType = 'post';
          break;
        case 'info':
          detailType = 'info';
          break;
        case 'slide':
          detailType = 'slide';
          break;
        case 'term':
          detailType = 'term';
          break;
        default:
          detailType = 'normal';
      }
      switch (mraUI.listType) {
        case 'grid':
          listType = 'grid';
          break;
        case 'table':
          listType = 'table';
          break;
        case 'slide':
          break;
        default:
          listType = 'list';
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
      listTitle = mraUI.listTitle;
      detailTitle = mraUI.detailTitle;
      disableListSearch = !!mraUI.disableListSearch;
      detailActionButtons = mraUI.detailActionButtons || detailActionButtons;
      listActionButtons = mraUI.listActionButtons || listActionButtons;
      detailRefBlackList = mraUI.detailRefBlackList || detailRefBlackList;
      detailRefName = mraUI.detailRefName || detailRefName;
      selectActionViewType = mraUI.selectActionViewType || selectActionViewType;
      listCategoryField = mraUI.listCategoryField || listCategoryField;
      listCategoryShowMore = mraUI.listCategoryShowMore || listCategoryShowMore;

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
      if (mraUI.detailActions) {
        detailActions = mraUI.detailActions;
      }
    }
    let listTypes = ['list', 'grid', 'table'];
    const tindex = listTypes.indexOf(listType);
    if (tindex !== -1) listTypes.splice(tindex, 1);
    listTypes = [listType].concat(listTypes);

    let embeddedViewOnly = schemaDef.embeddedViewOnly? true: false;
    let viewName = schemaDef.name; //Display name on UI
    let api = schemaDef.api || "LCRUD"; //APIs exposed to front end ("LCRUD")
    api = api.toUpperCase();

    let actionViews = schemaDef.actionViews || ''; //extra views: H, S, ...
    actionViews = actionViews.toUpperCase();

  	//views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
  	if (typeof views !== 'object' || !Array.isArray(views)) {
  		console.error("Error: input file must export an object defining an array for each schema.");
  		_exit(1);
  	}
  	let schemaName = name.toLowerCase();
  	//let model = mongoose.model(name, mongooseSchema, ); //model uses given name
  	//console.log("----------------------------");
  	//console.log(model);
  	
  	let componentDir = path.join(outputDir, schemaName);
  	if(!fs.existsSync(componentDir)) {
  		//console.info('Creating component directory "%s"...', componentDir);
  		mkdir(".", componentDir)
  	}
  
  	let subComponentDirs = [];
    if (api.includes("L")) subComponentDirs.push(schemaName+'-list');
    if (api.includes("R")) subComponentDirs.push(schemaName+'-detail');
    if (api.includes("C") || api.includes("U")) subComponentDirs.push(schemaName+'-edit');
    subComponentDirs.forEach( (subComponent) => {
  		let subComponentDir = path.join(componentDir, subComponent);
  		if(!fs.existsSync(subComponentDir)) {
  			//console.info('Creating sub-component directory "%s"...', subComponentDir);
  			mkdir(".", subComponentDir)
  		}
    });
    let indexViewNames = [];
    //briefView, detailView, CreateView, EditView, SearchView, indexView]

    let [indexViewGrp, indexView, hasDate6, hasRef6, hasEditor6,
      hasReqGrp6, hasReqArr6, hasReqMap6, hasFileUpload6] =
        generateViewPicture(name, views[5], mongooseSchema, validators, indexViewNames);
    for (let s of indexView) {
      indexViewNames.push(s.fieldName);
    }

    let [briefViewGrp, briefView, hasDate1, hasRef1, hasEditor1, 
          hasReqGrp1, hasReqArr1, hasReqMap1, hasFileUpload1] =
            generateViewPicture(name, views[0], mongooseSchema, validators, indexViewNames);
    //console.log("***briefView", briefView);
    //console.log("***hasRef1", hasRef1);
    let [detailViewGrp, detailView, hasDate2, hasRef2, hasEditor2, 
          hasReqGrp2, hasReqArr2, hasReqMap2, hasFileUpload2] = 
            generateViewPicture(name, views[1], mongooseSchema, validators, indexViewNames);
    let [createViewGrp, createView, hasDate3, hasRef3, hasEditor3, 
          hasReqGrp3, hasReqArr3, hasReqMap3, hasFileUpload3] =
            generateViewPicture(name, views[2], mongooseSchema, validators, indexViewNames);
    let [editViewGrp, editView, hasDate4, hasRef4, hasEditor4, 
          hasReqGrp4, hasReqArr4, hasReqMap4, hasFileUpload4] =
            generateViewPicture(name, views[3], mongooseSchema, validators, indexViewNames);
    let [searchViewGrp, searchView, hasDate5, hasRef5, hasEditor5, 
          hasReqGrp5, hasReqArr5, hasReqMap5, hasFileUpload5] =
            generateViewPicture(name, views[4], mongooseSchema, validators, indexViewNames);

  	let schemaHasDate = hasDate5 || hasDate6;
  	let schemaHasRef = false;
    let schemaHasEditor = false;
    let schemaHasRequiredMultiSelection = false;
    let schemaHasRequiredArray = false;
    let schemaHasRequiredMap = false;
    let schemaHasFileUpload = false;
    if (api.includes("L")) { // includes list view
      schemaHasDate = schemaHasDate || hasDate1;
      schemaHasRef = schemaHasRef || hasRef1;
      schemaHasFileUpload = schemaHasFileUpload || hasFileUpload1;
      schemaHasEditor = schemaHasEditor || hasEditor1;
    }
    if (api.includes("R")) { // includes detail view
      schemaHasDate = schemaHasDate || hasDate2;
      schemaHasFileUpload = schemaHasFileUpload || hasFileUpload2;
      schemaHasEditor = schemaHasEditor || hasEditor2;
    }
    if (api.includes("C")) { // includes CreateView
      schemaHasDate = schemaHasDate || hasDate3;
      schemaHasRef = schemaHasRef || hasRef3;
      schemaHasEditor = schemaHasEditor || hasEditor3;
      schemaHasRequiredMultiSelection = schemaHasRequiredMultiSelection || hasReqGrp3;
      schemaHasRequiredArray = schemaHasRequiredArray || hasReqArr3;
      schemaHasRequiredMap = schemaHasRequiredMap || hasReqMap3;
      schemaHasFileUpload = schemaHasFileUpload || hasFileUpload3;
    }
    if (api.includes("U")) { // includes editView
      schemaHasDate = schemaHasDate || hasDate4;
      schemaHasRef = schemaHasRef || hasRef4;
      schemaHasEditor = schemaHasEditor || hasEditor4;
      schemaHasRequiredMultiSelection = schemaHasRequiredMultiSelection || hasReqGrp4;
      schemaHasRequiredArray = schemaHasRequiredArray || hasReqArr4;
      schemaHasRequiredMap = schemaHasRequiredMap || hasReqMap4;
      schemaHasFileUpload = schemaHasFileUpload || hasFileUpload4;
    }
    if (schemaHasDate) hasDate = true;
    if (schemaHasRef) hasRef = true;
    if (schemaHasEditor) hasEditor = true;
    if (schemaHasRequiredMultiSelection) hasRequiredMultiSelection = true;
    if (schemaHasRequiredArray) hasRequiredArray = true;
    if (schemaHasRequiredMap) hasRequiredMap = true;
    if (schemaHasFileUpload) hasFileUpload = true;
      
    //let detailFields = views[1].replace(/\|/g, ' ').match(/\S+/g) || [];
    let detailSubViewStr = views[1];
  	let briefFields = views[0].replace(/\|/g, ' ').match(/\S+/g) || [];
  	for (let i of briefFields) {
  	  detailSubViewStr = detailSubViewStr.replace(i, '');
  	}
  	let [detailSubViewGrp, detailSubView, hasDate7, hasRef7, 
          hasEditor7, hasReqGrp7, hasReqMap7, hasFileUpload7] =
          generateViewPicture(name, detailSubViewStr, mongooseSchema, validators, indexViewNames);

    let compositeEditView = [];
  	if (api.includes("U") ) {
      compositeEditView = editView.slice();
  	}
  	if (api.includes("C") ) {
      let editFields = compositeEditView.map( x => x.fieldName);
      createView.forEach( function(x) {
        if (!editFields.includes(x.fieldName)) compositeEditView.push(x);
      });
    }
  	
  	let compositeEditBriefView = compositeEditView.slice(); //do reference include for this view.
    if (api.includes("L") ) {
      let compositeEditFields = compositeEditBriefView.map( x => x.fieldName);
      briefView.forEach(  function(x) {
        if (!compositeEditFields.includes(x.fieldName)) compositeEditBriefView.push(x);
      });
    }
    if (api.includes("R")) { //also add the "Detailed" view for links on reference
      let compositeEditFields = compositeEditBriefView.map( x => x.fieldName);
      detailView.forEach(  function(x) {
        if (!compositeEditFields.includes(x.fieldName)) compositeEditBriefView.push(x);
      });
    }

  	let SchemaName = capitalizeFirst(schemaName);
  	let SchemaCamelName = viewName? viewName : capitalizeFirst(name);
  	let schemaCamelName = lowerFirst(SchemaCamelName);
  	let schemaHasValidator = false;
  	
  	compositeEditView.forEach(function(x){ //validators:
  		if (x.validators) {
  			schemaHasValidator = true;
  			validatorFields.push( 
  			{ Directive: SchemaName+'Directive'+x.FieldName,
  			 schemaName: schemaName,
  			})
  		}
  	});
  	
    let mapFieldsRef = [];
  	compositeEditBriefView.forEach(function(x) { //Ref fields: for edit create view, or search in list view
  		if (x.ref) {
  		  referenceSchemas.push(x.ref);
        let isArray = x.type == "SchemaArray";
  			referenceMap.push(JSON.stringify([schemaName, SchemaName, x.fieldName, x.ref, x.Ref, SchemaCamelName, x.RefCamel, isArray, api]))
  		}
      if (x.mapKeyInfo && x.mapKeyInfo.type == 'ObjectId') {
        mapFieldsRef.push([x.mapKeyInfo.refSchema, x.mapKeyInfo.refService]);
      }
    });
    
    let defaultSortFieldDisplay;
    if (defaultSortField) {
      let fieldFound = false;
      for (let i=0; i<briefView.length; i++) {
        if (briefView[i].fieldName === defaultSortField) {
          defaultSortFieldDisplay = briefView[i].displayName;
          fieldFound = true;
          break;
        }
      }
      if (!fieldFound) {
        console.log('Sorting field is not found in view definition. Ignore... ', defaultSortField);
        defaultSortField = undefined;
      }
    }

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
          
  		compositeEditView: compositeEditView,
  		compositeEditBriefView: compositeEditBriefView,
  		mapFieldsRef: mapFieldsRef,
  		
  		componentDir: componentDir,
  		dateFormat: dateFormat,
  		timeFormat: timeFormat,
  		schemaHasDate: schemaHasDate,
  		schemaHasRef: schemaHasRef,
      schemaHasEditor: schemaHasEditor,
      schemaHasRequiredMultiSelection: schemaHasRequiredMultiSelection,
      schemaHasRequiredArray: schemaHasRequiredArray,
      schemaHasRequiredMap: schemaHasRequiredMap,
      schemaHasFileUpload: schemaHasFileUpload,
      schemaHasValidator: schemaHasValidator,
      permission: schemaAnyonePermission,
      embeddedViewOnly: embeddedViewOnly,

      listType, // gird, table, list
      listTypes, // array of ordered list type
      listTitle, //array of grid, table, list
      listToDetail, // link, click, none
      disableListSearch,
      listActionButtons,
      listCategoryField,
      listCategoryShowMore,

      detailType, // normal, post, info, slide, term...
      detailActionButtons,
      detailRefName,
      detailTitle,

      defaultSortField,
      defaultSortFieldDisplay,
      defaultSortOrder,
      homeListNumber,
      detailActions,
      detailRefBlackList,

      selectActionViewType,

      generateView,
      
      api,
      actionViews,
      refApi: {},
      associations, // in the parent schema that needs to show associations
      associationFor: [], //in the association schema itself
      
      fileServer: fileServer,

  		FIELD_NUMBER_FOR_SELECT_VIEW: FIELD_NUMBER_FOR_SELECT_VIEW
  	}
  	//console.log("======schemaObj", schemaObj);
  	
  	if (!defaultSchema) defaultSchema = schemaName;
  	schemaMap[schemaName] = schemaObj;
  } /*End of schema name loop*/
  
  referenceSchemas = referenceSchemas.filter((value, index, self) => { 
    return self.indexOf(value) === index;
  });//de-duplicate
  let referenceObjSchemas = referenceSchemas.map((value) => { 
    return {ref: value, Ref: capitalizeFirst(value)};
  });
  referenceMap = referenceMap.filter((value, index, self) => { 
    return self.indexOf(value) === index;
  });//de-duplicate
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
          obj.api = schemaObj.api; //assign api to the referenceSchema
        }
      }
    }
    else {
      schemaObj.referred = false;
    }
    schemaObj.referredBy = referenceMap.filter(x=>x[3]==schemaName);
      //Each item has [who (it), Who, which field, refer to me, Me, WhoCamel, MeCamel, isArray, its api, my api, its name] format


    let assoRoutes = []; 

    for (let ref of schemaObj.referredBy) {
      let refApi = ref[8]; 
      let refname = ref[0]; //ref all in lower case
      let refName = ref[10]; //defined schema name
      if (schemaObj.detailRefBlackList && schemaObj.detailRefBlackList.includes(refName)) {
        continue;
      }
      if (!refApi.includes("L")) {
        continue;
      }
      if (!schemaObj.associations[refName]) {
        continue;
      }
      // refer to which schema(lower case), the schema's formal schema name, the asso filed, 
      //    the Label text triggering the asso, my schemaName (lower case)
      //    the assoField schema (lower case), the assoField SchemaName
      let [assoField, assoText] = schemaObj.associations[refName];
      let assoRecord = [refname, refName, assoField, assoText, schemaObj.schemaName];

      let assocationSchema = schemaMap[ref[0]];

      for (let field of assocationSchema.detailView) {
        //find out the schema of the association schema
        if (field.fieldName === assoField && field.ref) {
          assoRecord.push(field.ref);
          assoRecord.push(field.Ref);
        } else {
          assoRecord.push(null);
          assoRecord.push(null);
        }
      }

      assoRoutes.push(assoRecord);
      // Put to the association schema object
      assocationSchema.associationFor.push(assoRecord);
    }

    schemaObj.assoRoutes = assoRoutes;
  }

  let renderObj = {
  	moduleName: moduleName,
  	ModuleName: ModuleName,
    apiBase: apiBase,
  	schemaMap: schemaMap,
  	defaultSchema: defaultSchema,
    validatorFields: validatorFields,
    referenceSchemas: referenceObjSchemas, //schemas that are referred
  	hasDate: hasDate,
  	hasRef: hasRef,
    hasEditor: hasEditor,
    hasRequiredMultiSelection: hasRequiredMultiSelection,
    hasRequiredArray: hasRequiredArray,
    hasRequiredMap: hasRequiredMap,
    hasFileUpload: hasFileUpload,
  	dateFormat: dateFormat,
    timeFormat: timeFormat,
    authRequired: authRequired,
    fileServer: fileServer,

    generateView: generateView,
  }
  //console.log("***renderObj", renderObj);
  //generateSourceFile(null, templates.mraCss, {}, parentOutputDir);
  
  generateSourceFile(moduleName, templates.conf, renderObj, parentOutputDir);
  
  generateSourceFile(moduleName, templates.mainModule, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponent, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponentHtml, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponentCss, renderObj, outputDir);
  generateSourceFile(moduleName, templates.tokens, renderObj, outputDir);
  
  generateSourceFile(moduleName, templates.routingModule, renderObj, outputDir);
  generateSourceFile(moduleName, templates.routingPath, renderObj, outputDir);
  
  
  if (hasDate || hasRequiredMultiSelection || hasRequiredArray || hasRequiredMap) {
    generateSourceFile(moduleName, templates.mainDirective, renderObj, outputDir);
  }
  
  for (let key in schemaMap) {
    let schemaObj = renderObj.schemaMap[key];
  	let componentDir = schemaObj.componentDir;
  	let schemaName = schemaObj.schemaName;

  	generateSourceFile(schemaName, templates.schemaBaseService, schemaObj, componentDir);
  	generateSourceFile(schemaName, templates.schemaService, schemaObj, componentDir);
  	generateSourceFile(schemaName, templates.schemaComponent, schemaObj, componentDir);

  	if (schemaObj.api.includes("L")) {
    	let subComponentDir = path.join(componentDir, schemaName+'-list');
    	generateSourceFile(schemaName, templates.schemaListComponent, schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaListComponentHtml, schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaListComponentCss, schemaObj, subComponentDir);
    	if (referenceSchemas.indexOf(schemaName) != -1) { //referenced by others, provide select component
    		generateSourceFile(schemaName, templates.schemaSelectComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaSelectComponentHtml, schemaObj, subComponentDir);
        }
    	if (schemaObj.schemaHasRef) {
    		generateSourceFile(schemaName, templates.schemaListSubComponent, schemaObj, subComponentDir);
        generateSourceFile(schemaName, templates.schemaListSubComponentHtml, schemaObj, subComponentDir);
        
        if (schemaObj.associationFor.length > 0) {
      		generateSourceFile(schemaName, templates.schemaListAssoComponent, schemaObj, subComponentDir);
          generateSourceFile(schemaName, templates.schemaListAssoComponentHtml, schemaObj, subComponentDir);
        }
      }
      if (schemaObj.actionViews.includes('H')) { //generate home component
        generateSourceFile(schemaName, templates.schemaListHomeComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaListHomeComponentHtml, schemaObj, subComponentDir);
      }
      if (schemaObj.actionViews.includes('S')) { //generate select component for pipeline/composite
        generateSourceFile(schemaName, templates.schemaListActSelComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaListActSelComponentHtml, schemaObj, subComponentDir);
      }
      if (schemaObj.actionViews.includes('D')) { //generate slides component
        generateSourceFile(schemaName, templates.schemaListActSldComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaListActSldComponentHtml, schemaObj, subComponentDir);
      }
  	}

    if (schemaObj.api.includes("R")) {
    	subComponentDir = path.join(componentDir, schemaName+'-detail');
    	generateSourceFile(schemaName, templates.schemaDetail[schemaObj.detailType][0], schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaDetail[schemaObj.detailType][1], schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaDetail[schemaObj.detailType][2], schemaObj, subComponentDir);
    	if (referenceSchemas.indexOf(schemaName) != -1) { //referenced by others, provide select component
    		generateSourceFile(schemaName, templates.schemaDetailSelComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailSelComponentHtml, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailPopComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailPopComponentHtml, schemaObj, subComponentDir);
      }
    	if (schemaObj.schemaHasRef) {
    		(schemaName, templates.schemaListSubComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailSubComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailSubComponentHtml, schemaObj, subComponentDir);
      }
      if (schemaObj.assoRoutes.length > 0) { // has association defined
    		generateSourceFile(schemaName, templates.schemaDetailAssoComponent, schemaObj, subComponentDir);
    		generateSourceFile(schemaName, templates.schemaDetailAssoComponentHtml, schemaObj, subComponentDir);
      }
    }

    if (schemaObj.api.includes("U") || schemaObj.api.includes("C")) {
    	subComponentDir = path.join(componentDir, schemaName+'-edit');
    	generateSourceFile(schemaName, templates.schemaEditComponent, schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaEditComponentHtml, schemaObj, subComponentDir);
    	generateSourceFile(schemaName, templates.schemaEditComponentCss, schemaObj, subComponentDir);
    }
  } /*End of generate source for each schema*/

  return;

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('destination is not empty, continue? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          createApplication(appName, destinationPath)
        } else {
          console.error('aborting')
          exit(1)
        }
      })
    }
  })
}

/**
 * Make the given dir relative to base.
 *
 * @param {string} base
 * @param {string} dir
 */

function mkdir (base, dir) {
  var loc = path.join(base, dir)

  console.log('   \x1b[36mcreate\x1b[0m : ' + loc + path.sep)
  mkdirp.sync(loc, MODE_0755)
}

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption (originalName, newName) {
  return function (val) {
    warning(util.format("option `%s' has been renamed to `%s'", originalName, newName))
    return val
  }
}

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {String} message
 */

function warning (message) {
  console.error()
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line)
  })
  console.error()
}

/**
 * echo str > file.
 *
 * @param {String} file
 * @param {String} str
 */

function write (file, str, mode) {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + file)
}
/**
 * echo str >> file.
 *
 * @param {String} file
 * @param {String} str
 */

function append (file, str, mode) {
  let fileMode = { mode: mode || MODE_0666 };
  let date = new Date();
  
  if(!fs.existsSync(file)) {
    fs.appendFileSync(file, str, fileMode)
    console.log('   \x1b[36mcreate\x1b[0m : ' + file)
  } else {
    let result = "";
    console.log('   \x1b[36mappend to\x1b[0m : ' + file)
    console.log('      IMPORTANT! Please check content and merge if necessary.')
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        return;
      }
      result = data.replace(/\/\*>>>(.*\n)+.*<<<\*\/\n/g, '');
      fs.writeFileSync(file, result, fileMode)
      fs.appendFileSync(file, "/*>>> Please check this recent updates and merge with existing ones***\n", fileMode)
      fs.appendFileSync(file, "**Date: " + date + "\n\n", fileMode)
      fs.appendFileSync(file, str, fileMode)
      fs.appendFileSync(file, "**** End of recent updates.<<<*/\n", fileMode)
    })
  }
}
