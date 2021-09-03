const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const meanRestExpress = require('@hicoder/express-core');

const emailSystemDef = require('./model');

const MDDS_EMAIL_TOKEN = 'this is a normal one used for mdds normal';

function modelExecuteSuccess(taskStr) {
  function doSomething(result) {
    console.log(" --- Emailing: model excecute succeeded: ", taskStr);
  }
  return doSomething;
}
function modelExecuteError(taskStr) {
  function doSomething(err) {
    if (err.code === 11000) console.log(" --- Emailing: model excecute already exist: ", taskStr);
    else if (err.errmsg) console.warn(" --- Emailing: model excecute failed: ", taskStr, err.errmsg);
    else console.warn(" --- Emailing: model excecute failed: ", taskStr, err.message);
  }
  return doSomething;
}
function populateSettingsToDB() {
  const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
  const restController = router.restController;
  
  async function runDB() {  
    const takInfo = `create email setting ...`;
    await restController.ModelExecute(
            "emailSettings",
            "create",
            {settingName: 'Settings',
             defaultSender: 'sampleemailxibinliu@gmail.com'} //document
        ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
  }
  
  runDB();
}

function getTags(arr) {
  let tags = [];
  for (let ele of arr) {
    let tags1 = ele.match(/\{\{.+?\}\}/g) || [];
    tags1 = tags1.map(x=>x.slice(2, -2));
    tags = tags.concat(tags1);
  }
  return tags.filter((x, i) => tags.indexOf(x) === i);
}

function replaceTags(arr, replacements) {
  let tags = getTags(arr);
  if (tags.length == 0) return arr; // no tags to replace
  let replaced = [];
  for (let ele of arr) {
    for (let rep of replacements) {
      for (let i of tags) {
        if (i in rep) {
          const reg = new RegExp(`{{${i}}}`, 'g');
          ele = ele.replace(reg, rep[i]);
        }
      }
    }

    ele = ele.replace(/http(s)?:\/\/(http(s)?:\/\/)/g, '$2'); //fix the template link issue
    replaced.push(ele);
  }
  return replaced;
}

let LOGGER;
function log(method, ...params) {
  if (!LOGGER) {
    return;
  }
  if (!LOGGER[method]) {
    return;
  }
  LOGGER[method].apply(LOGGER, params);
}

class MddsEmailer {
  constructor(configJsonFile, logger) {
    this.configJsonFile = configJsonFile;
    AWS.config.loadFromPath(configJsonFile);
    const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
    this.restController = router.restController;

    LOGGER = logger;
  }

  populateTemplatesToDB(templates) {
    (async () => {  
      for (let temp of templates) {
        const takInfo = `create email template ${temp.templateName} ...`;
        await this.restController.ModelExecute(
                "emailTemplate",
                "create",
                temp //document
            ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
      }
    })();    
  }

  // sendEmailTemplate sends email from template.
  async sendEmailTemplate(to, templateTag, substitution, substitutions) {
    let template;

    let success = 0, fail = 0, queuing = 0, errors = [];
    try {
      template = await this.restController.ModelExecute(
        "emailTemplate",
        "findOne",
        {tag: templateTag}, //search criteria
      );

      if (!template) {
        throw new Error(`Template not found ${templateTag}`);
      }
    } catch(err) {
      errors.push(err);
      return {success, fail, queuing, errors};
    }

    let content = template.content;
    if (!to || (Array.isArray(to) && to.length === 0)) {
      if (template.toEmails && template.toEmails.length > 0) {
        to = template.toEmails;
        if (substitutions && substitutions.length == 1) {
          let newSubs = [];
          for(let i = 0; i < template.toEmails.length; i++) {
            newSubs.push(substitutions[0]);
          }
          substitutions = newSubs;
        }
      } else {
        errors.push(new Error('No recipients are specified'))
        return {success, fail, queuing, errors};
      }
    }
    return await this.sendEmail(template.fromEmail, to, template.subject, content, substitution, substitutions);
  }

  async sendEmail(from, to, subject, content, substitution, substitutions) {
    let success = 0, fail = 0, queuing = 0, errors = [];

    if (!from) {  
      try {
        const setting = await this.restController.ModelExecute(
          "emailSettings",
          "findOne",
          {}//search criteria
        );

        if (!setting) {
          throw new Error('no email settings found');
        }

        from = setting.defaultSender;
      } catch(err) {
        errors.push(err);
        return {success, fail, queuing, errors};
      }
    }
    if (substitutions && to.length != substitutions.length) {
      errors.push(new Error(`substitutions don't match the recipient number.`));
      return {success, fail, queuing, errors};
    }

    let tags = getTags([subject, content]);
    let replacements = [];
    let defaultReplacement = {};

    if (tags.includes('mddsEmailToken')) { //reserved tokens
      if (!substitutions) {
        substitutions = [];
      }
      for (let [idx, t] of to.entries()) {
        if (substitutions.length === idx) {
          substitutions.push({});
        }
        substitutions[idx].mddsEmailToken = jwt.sign(
          {email: t}, 
          MDDS_EMAIL_TOKEN,
          {expiresIn: 60*60*24*30} // 30 days
        );
      }
    }

    if (substitutions && tags.length > 0) { // if there are per recipient substitution
      for (let idx = 0; idx < to.length; idx++) {
        let sub = substitutions[idx];
        let replacement = {};
        for (let ele of tags) {
          if (ele in sub) {
            replacement[ele] = sub[ele];
          }
        }
        replacements.push(replacement);
      }
    }
    if (substitution && tags.length > 0) {
      for (let ele of tags) {
        if (ele in substitution) {
          defaultReplacement[ele] = substitution[ele];
        } else {
          defaultReplacement[ele] = ele; //Make sure there is fallback value. TODO: Allow fall back value 
        }
      }
    }

    let emailsToSend = {
      from,
      to: JSON.stringify(to),
      number: to.length,
      subject,
      content,
      replacements: JSON.stringify(replacements),
      defaultReplacement: JSON.stringify(defaultReplacement),
    }
    try {
      const doc = await this.restController.ModelExecute(
        'emailQueue',
        'create',
        emailsToSend,
      )
      return {success, fail, queuing: to.length, errors};
    } catch (err) {
      errors.push(err);
      return {success, fail, queuing, errors};
    }
  }

  startDaemon() {
    setTimeout( async ()=>{
      try {
        await this.checkQueue({processed: false});
      } catch (err) {
        log('error', `checkQueue error: ${err.message}`);
      }
      this.startDaemon();
    }, 10000); 
  }

  async checkQueue(filter) {
    try {
      let docs = [];
      const result = await this.restController.ModelExecute2(
        "emailQueue",
        [
          ['findOne', [filter]], //search criteria
          ['sort', [[['createdAt', 1]]]],
        ]
      );
      if (!result) return;

      log('debug', `Email checkQueue - email to send: ${result.number}`);
      docs.push(result);

      const promises = [];
      for (let doc of docs) {
        promises.push(
          // anonymouse function to avoid closure issue
          ((d)=>{
            let to = JSON.parse(d.to);
            let replacements = JSON.parse(d.replacements);
            let defaultReplacement = JSON.parse(d.defaultReplacement);
            return new Promise((resolve, reject) => {
              this.sendToSESMany(d.from, to, d.subject, d.content, replacements, defaultReplacement).then((re) => {
                resolve(re); // {success: 0, fail: 0, errors: []}
              }).catch(err => {
                resolve({success: 0, fail: to.length, errors: [err]});
              })
            })
          })(doc)
        );
      }
      const results = await Promise.all(promises);

      let success = 0; let fail = 0; let errMsg = '';
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        docs[i].processed = true;
        docs[i].sent = result.success;
        if (result.errors && result.errors.length > 0) {
          docs[i].result = result.errors[0].message;
          errMsg += docs[i].result + '\n';
        }
        success += result.success;
        fail += (docs[i].number - result.success);
      }

      log('debug', `Email checkQueue - email sent - success: ${success}, fail: ${fail}, ${errMsg}`);
      for (let doc of docs) {
        try {
          await this.restController.ModelExecute(
            'emailQueue',
            'updateOne',
            {_id: doc._id},
            doc
          )
        } catch (err) {
          log('error', `Email checkQueue - error to update result: ${err}`);
        }
      }
    } catch(err) {
      log('error', `Email checkQueue - error to querry queue: ${err}`);
    }
  }

  async sendToSESMany(from, to, subject, content, replacements, defaultReplacement) {
    if (to && to.length === 1) {
      return this.sendToSESSingle(from, to, subject, content, replacements, defaultReplacement);
    }

    const ses = new AWS.SES({apiVersion: '2010-12-01'});

    function sendEmailPromise(num, parameters) {
      const promise = new Promise( (resolve, reject) => {
        log('debug', `Email sendBulkTemplatedEmail - request: ${JSON.stringify(parameters)}`);
        ses.sendBulkTemplatedEmail(parameters).promise().then(
          (re) => {
            let success = 0, fail = 0, errors = [];
            for (let status of re.Status) {
              if (status.Status === 'Success') {
                success += 1;
              } else {
                fail += 1;
                errors.push(new Error(`${status.Status}: ${status.Error}`));
              }
            }
            log('debug', `Email sendBulkTemplatedEmail - response: ${JSON.stringify(re)}`);
            resolve({success, fail, errors});
          }
        ).catch(
          (er) => {
            resolve({fail: num, success: 0,  errors: [er]});
          }
        );
      });
      return promise;
    }

    async function createTemplate(subject, content) {
      const name = 'mdds_' + process.env.APP_NAME + '_' + Date.now();
      const params = {
        Template: { /* required */
          TemplateName: name, /* required */
          HtmlPart: content,
          SubjectPart: subject,
        }
      };

      await ses.createTemplate(params).promise();
      return name;
    }
    async function deleteTemplate(template) {
      const params = {
        TemplateName: template /* required */
      };
      try {
        await ses.deleteTemplate(params).promise();
      } catch (err) { // ignore
        log('warn', `Email deleteTemplate - error: ${err.stack}.`)
        return;
      }
    }

    content = content.replace(/http(s)?:\/\/(http(s)?:\/\/)/g, '$2'); //fix the template link issue
    return new Promise(async (resolve, reject) => {
      let success = 0, fail = 0, errors = [];

      // 1. create template
      let template;
      try {
        template = await createTemplate(subject, content);
      } catch (err) {
        log('warn', `Email createTemplate - error: ${err.stack}.`)
        reject(err);
      }
      // 2. split groups
      const recipientsPerGroup = 45; //AWS limit is 50
      const groupNum = Math.floor(to.length / recipientsPerGroup) + 1;
      const promises = [];
      for (let i = 0; i < groupNum; i++) {
        const start = i * recipientsPerGroup;
        const end = (i + 1) * recipientsPerGroup;
        const grp = to.slice(start, end);
        let reps;
        if (replacements && replacements.length === to.length) {
          reps = replacements.slice(start, end);
        }

        let destinations = [];
        for (let j = 0; j < grp.length; j++) {
          const replacementTags = [];
          let rep ={};
          if (reps) {
            rep = reps[j];
            for (let tag in rep) {
              replacementTags.push({
                Name: tag, /* required */
                Value: rep[tag], /* required */
              });
            }
          }
          destinations.push({
            Destination: { /* required */
              BccAddresses: [
                /* more items */
              ],
              CcAddresses: [
                /* more items */
              ],
              ToAddresses: [
                grp[j],
                /* more items */
              ]
            },
            // ReplacementTags: replacementTags,
            ReplacementTemplateData: JSON.stringify(rep),
          });
        }
        const defaultTags = [];
        let rep = {};
        if (defaultReplacement) {
          rep = defaultReplacement;
          for (let tag in rep) {
            defaultTags.push({
              Name: tag, /* required */
              Value: rep[tag], /* required */
            });
          }
        }

        const params = {
          Destinations: destinations, /* required */

          Source: from, /* required */
          Template: template, /* required */
          // DefaultTags: defaultTags,
          ReplyToAddresses: [
            /* more items */
          ],
          DefaultTemplateData: JSON.stringify(defaultReplacement),
        };
        promises.push(sendEmailPromise(grp.length, params));
      }

      // 3. send all groups
      // will not throw errors - see above sendEmailPromise funciton
      const results = await Promise.all(promises);

      // 4. handle result
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        success += result.success;
        fail += result.fail;
        errors.concat(result.errors);
      }

      // 5. remote template
      deleteTemplate(template);

      resolve({success, fail, errors});
    });
  }

  sendToSESSingle(from, to, subject, content, replacements, defaultReplacement) {
    if (to.length > 1) {
      log('warn', `Email sendToSESSingle - got ${to.length} emails to send. Only first one will be sent.`)
    }
    to = to.slice(0,1);

    const reps = [];
    if (replacements && replacements.length > 0) {
      reps.push(replacements[0]);
    }
    if (defaultReplacement) {
      reps.push(defaultReplacement);
    }

    let [replacedSub, replacedCont] = replaceTags([subject, content], reps);
    const params = {
      Destination: { /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: to, // array
        BccAddresses: [], // array
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
          Charset: "UTF-8",
          Data: replacedCont,
          },
          Text: {
          Charset: "UTF-8",
          Data: replacedCont,
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: replacedSub,
        }
      },
      Source: from, /* required */
    };
    return new Promise((resolve, reject) => {
      log('debug', `Email sendEmail - request: ${JSON.stringify(params)}`);
      new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise().then(
        (re) => {
          log('debug', `Email sendEmail - response: ${JSON.stringify(re)}`);
          resolve({success: 1, fail: 0, errors: []});
        }
      ).catch(
        (er) => {
          resolve({success: 0, fail: 1, errors: [er]});
        }
      );
    });
  }
}

//used to manage the public access
function GetEmailingManageRouter(moduleName, authAppFuncs) {
  const router =  meanRestExpress.RestRouter(emailSystemDef, moduleName, authAppFuncs);
  populateSettingsToDB();
  return router;
}

module.exports = {
  GetEmailingManageRouter,
  MddsEmailer,
};
