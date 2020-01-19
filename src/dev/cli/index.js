#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const path = require('path');
const fs = require("fs");
const fsExtra = require('fs-extra')
const https = require('https');
const unzipper = require('unzipper');

const pjson = require('./package.json');

async function downloadAndUnzip(url, toPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const unzipStream = unzipper.Extract({ path: toPath });
            response.pipe(unzipStream);
            unzipStream.on('close', () => {
                resolve();
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}
async function replaceContent(file, reg, replaceTo) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
              reject (err);
              return;
            }
            const result = data.replace(reg, replaceTo);

            fs.writeFile(file, result, 'utf8', function (err) {
               if (err) {
                   reject (err);
                   return;
               }
               resolve();
            });
        });
    });
}

function cleanup(appDir) {
    fsExtra.removeSync(appDir);
}

async function newApp(name) {
    let appName = name;
    while (!appName) {
        const answer = await inquirer.prompt([
            {
                type: 'text',
                message: 'Please input the application name:',
                name: 'appName',
            }
        ]);
        appName = answer.appName;
        appName = appName.trim().replace(/\s+/g, '_');
    }
    console.log(`Generating workspace for app ${appName}...`);
    const cwd = process.cwd();
    const appDir = path.join(cwd, appName);
    if (fs.existsSync(appDir)) {
        console.error(`Error! Directory ./${appName} exists.`)
        return;
    }

    try {
        fs.mkdirSync(appDir);

        await downloadAndUnzip(
            'https://codeload.github.com/hicodingclub/club-website-backend/zip/master',
            appDir
        );
        await downloadAndUnzip(
            'https://codeload.github.com/hicodingclub/club-website-frontend/zip/master',
            appDir
        );

        const backEnd = path.join(appDir, 'club-website-backend-master');
        const backEndNew = path.join(appDir, 'backend');
        const frontEnd = path.join(appDir, 'club-website-frontend-master');
        const frontEndNew = path.join(appDir, 'frontend');
        fs.renameSync(backEnd, backEndNew);
        fs.renameSync(frontEnd, frontEndNew);
    } catch (err) {
        console.error(`Error! Failed to download applications: ${err.message}`);
        cleanup(appName);
        return;
    }

    const angularConfigFiles = [
        [path.join(appDir, 'frontend', 'front-pub', 'angular.json'), '"outputPath": "../../backend/public",'],
        [path.join(appDir, 'frontend', 'front-adm', 'angular.json'), '"outputPath": "../../backend/public-admin",'],
    ];
    try {
        for (let i = 0; i < angularConfigFiles.length; i++) {
            const ele = angularConfigFiles[i];
            const angularConfig = ele[0];
            const outputPath = ele[1];
            await replaceContent(angularConfig, /"outputPath":[^,]*,/g, outputPath);
        }
    } catch (err) {
        console.error(`Error! Failed to change angular build output directory to backend: ${err.message}`);
        cleanup(appName);
        return;
    }

    console.log(`Done! Application ${appName} is created in ${appDir} directory.`);
}

program.version(pjson.version);
program
  .command('new [appname]')
  .description('greate a new workspace for the given application.')
  .action(newApp);
program.command(
    'angular-gen [options] <inputfile>',
    'generate Angular UI components with given input schema.',
    {executableFile: './node_modules/.bin/hg-angular-cli'}
);
program.parse(process.argv);
