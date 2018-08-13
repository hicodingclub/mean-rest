#!/usr/bin/env node
/*
 * Script to create angular UI and service code based on Mongoose schema. This is the command line
 * interface for mean-rest-angular package
 * 
 * The cli part code is based on the "express" cli. 
 */
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

var views_collection = {}; //views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
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

var templates = {
	//key:[template_file, output_file_suffix, description]
	mainModule: ["../templates/main.module.ts", ".module.ts", "main module file"],
	mainComponent: ["../templates/main.component.ts", ".component.ts", "main component file"],
	mainComponentHtml: ["../templates/main.component.html", ".component.html", "main component html file"],
	mainComponentCss: ["../templates/main.component.css", ".component.css", "main component css file"],
	routingModule: ["../templates/routing.module.ts", "routing.module.ts", "routing module file"],
	schemaBaseService: ["../templates/schema.base.service.ts", ".base.service.ts", "base service file"],
	schemaService: ["../templates/schema.service.ts", ".service.ts", "service file"],
	schemaComponent: ["../templates/schema.component.ts", ".component.ts", "component file"],
	schemaListComponent: ["../templates/schema-list.component.ts", "list.component.ts", "list component file"],
	schemaListComponentHtml: ["../templates/schema-list.component.html", "list.component.html", "list component html file"],
	schemaListComponentCss: ["../templates/schema-list.component.css", "list.component.css", "list component css file"],
	schemaDetailComponent: ["../templates/schema-detail.component.ts", "detail.component.ts", "detail component file"],
	schemaDetailComponentHtml: ["../templates/schema-detail.component.html", "detail.component.html", "detail component html file"],
	schemaDetailComponentCss: ["../templates/schema-detail.component.css", "detail.component.css", "detail component css file"],
	schemaEditComponent: ["../templates/schema-edit.component.ts", "edit.component.ts", "edit component file"],
	schemaEditComponentHtml: ["../templates/schema-edit.component.html", "edit.component.html", "edit component html file"],
	schemaEditComponentCss: ["../templates/schema-edit.component.css", "edit.component.css", "edit component css file"],
	mraCss: ["../templates/mean-express-angular.css", "mean-express-angular.css", "mean-rest-angular css file"],
}

var generateSourceFile = function(keyname, template, renderObj, outputDir) {
	let renderOptions = {};
	let templateFile = basedirFile(template[0]);
	let output = generatedFile(outputDir, keyname, template[1]);
	let description = template[2];

	//console.info('Generating %s for "%s"...', description, keyname);
  	ejs.renderFile(templateFile, renderObj, renderOptions, (err, str) => {
		if (err) {
			console.error("ERROR! Error happens when generating %s for %s: %s", description, keyname, err);
		}
		else {
			write(output, str);
		}
	});
}

var generateViewPicture = function(viewStr, schema) {
	let viewDef = viewStr.match(/\S+/g) || [];
	let view = [];
	viewDef.forEach((item) => {
		if (item in schema.paths) {
			let type = schema.paths[item].constructor.name;
			let defaultValue = schema.paths[item].defaultValue;
			switch(type) {
				case "SchemaString":
					if (!defaultValue) defaultValue = "''";
					else defaultValue = "'" + defaultValue + "'";
					break;
				case "SchemaBoolean":
					if (defaultValue !== false && !defaultValue) defaultValue = "null";
					break;
				case "SchemaNumber":
					if (defaultValue !== 0 && !defaultValue) defaultValue = "null";
					break;					
				default:
					if (!defaultValue) defaultValue = "null";
			}
			view.push(
					{fieldName: item,
					 FieldName: capitalizeFirst(item),
					 type: type,
					 //TODO: required could be a function
					 required: schema.paths[item].originalRequiredValue === true? true:false,
					 defaultValue: defaultValue,
					}
			);
		}
	});
	return view;
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
  .option('-a, --api <api_base>', 'api base that will be used for rest calls. Default is "<module_name>-rest".')
  .option('-o, --output <output_dir>', 'output directory of generated files')
  .option('-f, --force', 'force to overwrite existing files')
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
	  apiBase = moduleName + '-rest';
	  console.info('NOTE: REST API base is not provided. Use "%s" as api base...', apiBase);
  } else {
	  apiBase = program.api;
	  console.info('Using "%s" as api base to call Rest APIs...', apiBase);
  }
  
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
  let schemas = require(inputFileModule);
  
  let schemaArray = [];
  let defaultSchema;
  for (let name in schemas) {
	let views = schemas[name];
	//views in [schema, briefView, detailView, CreateView, EditView, SearchView] format
	if (typeof views !== 'object' || !Array.isArray(views)) {
		console.error("Error: input file must export an object defining an array for each schema.");
		_exit(1);
	}
	let schemaName = name.toLowerCase();
	//let model = mongoose.model(schemaName, views[0], );
	
	let componentDir = path.join(outputDir, schemaName);
	if(!fs.existsSync(componentDir)) {
		//console.info('Creating component directory "%s"...', componentDir);
		mkdir(".", componentDir)
	}

	let subComponentDir;
	[schemaName+'-list', schemaName+'-detail', schemaName+'-edit'].forEach( (subComponent) => {
		subComponentDir = path.join(componentDir, subComponent);
		if(!fs.existsSync(subComponentDir)) {
			//console.info('Creating sub-component directory "%s"...', subComponentDir);
			mkdir(".", subComponentDir)
		}
		
	});
	
	let mongooseSchema = views[0];
	console.log(mongooseSchema);

	let briefView = generateViewPicture(views[1], mongooseSchema);
	let detailView = generateViewPicture(views[2], mongooseSchema);
	let createView = generateViewPicture(views[3], mongooseSchema);
	let editView = generateViewPicture(views[4], mongooseSchema);
	let seachView = generateViewPicture(views[5], mongooseSchema);
		
	let schemaObj = {
		schemaName: schemaName,
		SchemaName: capitalizeFirst(schemaName),
		apiBase: apiBase,
		briefView: briefView,
		detailView: detailView,
		createView: createView,
		editView: editView,
		seachView: seachView,
	}
	
	generateSourceFile(schemaName, templates.schemaBaseService, schemaObj, componentDir);
	generateSourceFile(schemaName, templates.schemaService, schemaObj, componentDir);
	generateSourceFile(schemaName, templates.schemaComponent, schemaObj, componentDir);

	subComponentDir = path.join(componentDir, schemaName+'-list');
	generateSourceFile(schemaName, templates.schemaListComponent, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaListComponentHtml, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaListComponentCss, schemaObj, subComponentDir);

	subComponentDir = path.join(componentDir, schemaName+'-detail');
	generateSourceFile(schemaName, templates.schemaDetailComponent, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaDetailComponentHtml, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaDetailComponentCss, schemaObj, subComponentDir);

	subComponentDir = path.join(componentDir, schemaName+'-edit');
	generateSourceFile(schemaName, templates.schemaEditComponent, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaEditComponentHtml, schemaObj, subComponentDir);
	generateSourceFile(schemaName, templates.schemaEditComponentCss, schemaObj, subComponentDir);

	
	if (!defaultSchema) defaultSchema = schemaName;
	schemaArray.push(schemaObj);
  }
  
  let renderObj = {
	moduleName: moduleName,
	ModuleName: ModuleName,
	schemaArray: schemaArray,
	defaultSchema: defaultSchema
  }

  //generateSourceFile(null, templates.mraCss, {}, parentOutputDir);

  generateSourceFile(moduleName, templates.mainModule, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponent, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponentHtml, renderObj, outputDir);
  generateSourceFile(moduleName, templates.mainComponentCss, renderObj, outputDir);
  generateSourceFile(moduleName, templates.routingModule, renderObj, outputDir);  
  return;

  // App name

  // View engine
  if (program.view === true) {
    if (program.ejs) program.view = 'ejs'
    if (program.hbs) program.view = 'hbs'
    if (program.hogan) program.view = 'hjs'
    if (program.pug) program.view = 'pug'
  }

  // Default view engine
  if (program.view === true) {
    warning('the default view engine will not be jade in future releases\n' +
      "use `--view=jade' or `--help' for additional options")
    program.view = 'jade'
  }

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
