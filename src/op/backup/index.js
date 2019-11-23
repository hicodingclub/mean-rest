#!/usr/bin/env node

const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage')
const zipFolder = require('zip-folder');
const { promisify } = require("util");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const optionDefinitions = [
  { name: 'bucket', alias: 'b', type: String,
    description: 'The S3 bucket name',
  },
  { name: 'appdir', alias: 'a', type: String, defaultOption: true,
    description: 'Application directory',
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
      content: 'Backup application data.'
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
    options.appdir && fs.existsSync(options.appdir) &&
    options.bucket
  );

if (!valid) {
  help(1);
}

const envFile = path.join(options.appdir, '.env');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
} else {
  logger(`Warning: .env file doesn't exist: ${envFile}.`);
}

const awsConfFile = path.join(options.appdir, process.env.AWS_CONFIG_FILE_NAME||'.aws.conf.json');
if (!fs.existsSync(awsConfFile)) {
  logger(`Error: aws conf file doesn't exist: ${awsConfFile}.`);
  process.exit(3);
}

async function main() {
  const folders = [
    path.join(options.appdir, 'logs'),
    path.join(options.appdir, 'storage'),
  ];


  const execit = promisify(exec);
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/';
  const dumpDir = path.join(options.appdir, 'dump');
  try {
    logger(`Mongodb dumping...`);

    const { stdout, stderr } = await execit(`mongodump --uri="${mongoUrl}" --out="${dumpDir}"`);
    folders.push(dumpDir);
    logger(`Success: mongodb dumped...`);
  } catch(err) {
    logger(`Error: failed to dump mongodb: ${err.message}`);
  }

  const uploads = [];

  const zipit = promisify(zipFolder);
  for (const f of folders) {
    try {
      logger(`zipping folder ${f} to ${f}.zip`);

      await zipit(f, f + '.zip');
      uploads.push(f + '.zip');
    } catch (err) {
      logger(`Error to zip ${f}: ${err.message}`);
    }
  }

  AWS.config.loadFromPath(awsConfFile);

  // Create S3 service object
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});

  for (const f of uploads) {
    // Configure the file stream and obtain the upload parameters
    const fileStream = fs.createReadStream(f);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
      logger(`ERROR reading file stream from ${f}: ${err.message}`);
    });

    const uploadParams = {Bucket: options.bucket, Key: path.basename(f), Body: fileStream};

    // call S3 to retrieve upload file to specified bucket
    s3.upload (uploadParams, function (err, data) {
      if (err) {
        logger(`ERROR to upload ${f} to S3 ${options.bucket}: ${err.message}`);
      } if (data) {
        logger(`Success to upload ${f} to S3 ${options.bucket}.`);
      }
    });
  }
}

try {
  main();
} catch(err) {
  logger(`ERROR to execute main function: ${err.message}`);
}

/*
// Call S3 to list the buckets
s3.listBuckets(function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.Buckets);
  }
});

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// Create the parameters for calling createBucket
var bucketParams = {
  Bucket : process.argv[2],
  ACL : 'public-read'
};

// call S3 to create the bucket
s3.createBucket(bucketParams, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.Location);
  }
});

// Load the AWS SDK for Node.js
// Set the region 
AWS.config.update({region: 'REGION'});

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// call S3 to retrieve upload file to specified bucket
var uploadParams = {Bucket: process.argv[2], Key: '', Body: ''};
var file = process.argv[3];

// Load the AWS SDK for Node.js
// Set the region 
AWS.config.update({region: 'REGION'});

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// Create the parameters for calling listObjects
var bucketParams = {
  Bucket : 'BUCKET_NAME',
};

// Call S3 to obtain a list of the objects in the bucket
s3.listObjects(bucketParams, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});

*/
