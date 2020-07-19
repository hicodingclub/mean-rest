#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require("util");
const { exec } = require('child_process');

const moment = require('moment');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage')
const FileType = require('file-type');
const commandExistsSync = require('command-exists').sync;


const SupportedPictures = ['image/png', 'image/jpeg'];
const AllowedPictureSize = 500000;

const optionDefinitions = [
  { name: 'dir', alias: 'd', type: String, defaultOption: true,
    description: 'Directory to proces pictures',
  },
  { name: 'help', alias: 'h', type: Boolean,
    description: 'Print help informaiton'
  },
];

function logger(str) {
  let now = moment();
  const s = now.format() + ' ' + str;
  console.log(s);
}

function help(code) {
  const sections = [
    {
      header: 'A @hicoder tool',
      content: 'Reduce picture size under the given directory.'
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

const  valid = (
    /* all supplied files should exist and --log-level should be one from the list */
    options.dir && fs.existsSync(options.dir)
  );

if (!valid) {
  help(1);
}

if (!commandExistsSync('convert')) {
  console.log('Commandline tool not found: convert');
  console.log('-- Please install it with "apt install imagemagick" under unbuntu. Or equivilent under other OSes.');
  process.exit(1);
}

async function reduce(candidates) {
  const execit = promisify(exec);
  const tmpFileName = `mdds-tmp-${Date.now()}.jpg`

  for (let candidate of candidates) {
    const dir = path.dirname(candidate.file);
    const tmpFile = path.join(dir, tmpFileName);
    try {
      logger(`Convert ${candidate.file}. Original size: ${candidate.size}.`);
      let command  = `convert ${candidate.file} -quality ${candidate.quality} ${tmpFile}`;
      logger(`${command}`);
      await execit(command);
      // await execit(`mv ${candidate.file} ${candidate.file}.back`);
      await execit(`mv ${tmpFile} ${candidate.file}`);
    } catch(err) {
      logger(`Error: failed to convert ${candidate.file}: ${err.stack}`);
    }
  }
}

async function main() {
  const dir = options.dir;
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);
  
  const candidates = [];

  for (let f of files) {
    const file = path.join(dir, f);
    const stats = fs.statSync(file);
    const size = stats["size"];
    let ft;
    try {
      ft = await FileType.fromFile(file);
    } catch (err) {
      console.log(err.stack);
    }
    if (!ft) {
      continue;
    }
    if (!SupportedPictures.includes(ft.mime)) {
      continue;
    }
    if (size <= AllowedPictureSize) {
      continue;
    }
    let quality = 90;
    if (size > 2 * AllowedPictureSize) {
      quality = 80;
    }

    let factor = 1;
    if (ft.mime === 'image/jpeg') {
      factor = 0.5;
    }

    quality = quality * factor;
  
    candidates.push( 
      {
        file,
        type: ft,
        size,
        quality,
      }
    );
  }

  reduce(candidates);
}

try {
  main();
} catch(err) {
  logger(`ERROR to execute main function: ${err.message}`);
}
