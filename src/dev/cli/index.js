#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const path = require('path');
const fs = require("fs");
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
    console.log(`Generating workspace for app ${appName}`);
    const cwd = process.cwd();
    const appDir = path.join(cwd, appName);
    if (fs.existsSync(appDir)) {
        console.error(`Error! Directory ./${appName} exists.`)
        return;
    }
    try {
    } catch (err) {
        console.error(`Error! Failed to create new directory ./${appName}: ${err.message}`);
    }

    try {
        fs.mkdirSync(appDir);

        await downloadAndUnzip('https://codeload.github.com/hicodingclub/club-website-backend/zip/master', appDir);
        await downloadAndUnzip('https://codeload.github.com/hicodingclub/club-website-frontend/zip/master', appDir);

        const backEnd = path.join(appDir, 'club-website-backend-master');
        const backEndNew = path.join(appDir, 'backend');
        const frontEnd = path.join(appDir, 'club-website-frontend-master');
        const frontEndNew = path.join(appDir, 'frontend');
        fs.renameSync(backEnd, backEndNew);
        fs.renameSync(frontEnd, frontEndNew);
    } catch (err) {
        console.error(`Error! Failed to download applications: ${err.message}`);
    }


}

program.version(pjson.version);
program
  .command('new [appname]')
  .description('greate a new workspace for the given application.')
  .action(newApp);
program.command('angular-gen [options] <inputfile>', 'generate Angular UI components with given input schema.', {executableFile: './node_modules/.bin/hg-angular-cli'});
program.parse(process.argv);
