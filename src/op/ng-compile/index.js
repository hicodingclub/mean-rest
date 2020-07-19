#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require("util");
const { exec, spawn } = require('child_process');

const moment = require('moment');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage')
const winston = require('winston');

const PROJECT_OUTPUT = 'dist/demo';

const optionDefinitions = [
  { name: 'dir', alias: 'd', type: String, defaultOption: true,
    description: 'Directory of the target angular project',
  },
  { name: 'template', alias: 't', type: String,
    description: 'Template angular project directory',
  },
  { name: 'help', alias: 'h', type: String,
    description: 'Print help informaiton'
  },
];

function help(code) {
  const sections = [
    {
      header: 'A @hicoder tool',
      content: 'Fast build Angular project based on the template project'
    },
    {
      header: 'Options',
      optionList: optionDefinitions,
      group: '_none', // put all options without a group in this section
    }
  ];
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(code || 0);
}

const options = commandLineArgs(optionDefinitions)

if (options.help) {
  help(0);
}
let  valid = (
    /* all supplied files should exist and --log-level should be one from the list */
    options.dir && fs.existsSync(options.dir) && 
    options.template && fs.existsSync(options.template)
  );

if (!valid) {
  help(1);
}

const logFile = path.join(options.dir, 'hc-op-ngcompile.log');
const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    myFormat,
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
  ],
});


async function spawnit(command) {
  return new Promise((resolve, reject) => {
    const args = command.spawnargs;
    logger.info(`==== ${args.join(' ')}`);
    command.stdout.on('data', function (data) {
      logger.info(data.toString());
    });
    
    command.stderr.on('data', function (data) {
      logger.info(data.toString());
    });
    
    command.on('error', function (err) {
      logger.info(`child process exited with error ` + err.message);
      reject(err);
    });
    command.on('exit', function (code) {
      logger.info(`child process exited with code ` + code.toString());
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`exit with code ${code}`));
      }
    });
  });
};

function writeJson(obj, file) {
  let data = JSON.stringify(obj, null, 4);
  fs.writeFileSync(file, data);
}

const dir = options.dir;
const templateDir = options.template;
const result = {progress: 'Started'};
const resultFile = path.join(dir, 'hc-op-ngcompile.result.json');

async function main() {

  writeJson(result, resultFile);

  const tPackageFile = path.join(templateDir, 'package.json');
  const dPackageFile = path.join(dir, 'package.json');
  const dAngularFile = path.join(dir, 'angular.json');

  let valid = fs.existsSync(dPackageFile) && fs.existsSync(dAngularFile);
  if (!valid) {
    throw new Error(`Target directory doesn't contain angular project`);
  }

  // change the build output path
  const dAngularJson = require(dAngularFile);
  const defaultProj = dAngularJson.defaultProject;
  dAngularJson.projects[defaultProj].architect.build.options.outputPath = PROJECT_OUTPUT;
  writeJson(dAngularJson, dAngularFile);

  // upgrade the dependencies following the templates
  const tpackageJson = require(tPackageFile);
  const dpackageJson = require(dPackageFile);
  const packages = [tpackageJson.dependencies, tpackageJson.devDependencies];
  for (let packs of packages) {
    for (let dep in packs) {
      const v = packs[dep];
      let dv = dpackageJson.dependencies[dep];
      if (dv && dv !== v) {
        logger.info(`  -- dependencies: upgrading ${dep} from ${dv} to ${v}...`);
        dpackageJson.dependencies[dep] = v;
      }
      dv = dpackageJson.devDependencies[dep];
      if (dv && dv !== v) {
        logger.info(`  -- devDependencies: upgrading ${dep} from ${dv} to ${v}...`);
        dpackageJson.devDependencies[dep] = v;
      }
    }
  }

  const removePackages = [
    'core-js',
  ];
  for (let pkg of removePackages) {
    delete dpackageJson.dependencies[pkg];
    delete dpackageJson.devDependencies[pkg];
  }

  writeJson(dpackageJson, dPackageFile);

  try {
    // remove the existing node_nodules
    const nodeModulesDir = path.join(dir, 'node_modules');
    const rmnode = spawn('rm', ['-rf', nodeModulesDir]);
    await spawnit(rmnode);

    // copy the node_nodules from template
    const tNodeModulesDir = path.join(templateDir, 'node_modules');
    const cpnode = spawn('cp', ['-r', tNodeModulesDir, nodeModulesDir]);
    await spawnit(cpnode);

    const npminstall = spawn('npm', ['install'], {cwd: dir});
    await spawnit(npminstall);
    const build = spawn('ng', ['build'], {cwd: dir});
    await spawnit(build);
  } catch (err) {
    throw err
  }

  result.progress = 'Completed';
  writeJson(result, resultFile);
}

try {
  main();
} catch(err) {
  result.progress = 'Error';
  writeJson(result, resultFile);
  logger.error(`ERROR to execute main function: ${err.stack}`)
  console.log(`ERROR to execute main function: ${err.stack}`);
}
