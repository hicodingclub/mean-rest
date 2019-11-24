const AWS = require('aws-sdk');
const meanRestExpress = require('@hicoder/express-core');

const emailSystemDef = require('./model');

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

class MddsEmailer {
  constructor(configJsonFile) {
    this.configJsonFile = configJsonFile;
    AWS.config.loadFromPath(configJsonFile);
  }

  populateTemplatesToDB(templates) {
    const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
    const restController = router.restController;
    
    async function runDB() {  
      for (let temp of templates) {
        const takInfo = `create email template ${temp.templateName} ...`;
        await restController.ModelExecute(
                "emailTemplate",
                "create",
                temp //document
            ).then(modelExecuteSuccess(takInfo), modelExecuteError(takInfo));
      }
    }
    
    runDB();
  }

  async sendEmailTemplate(to, templateTag, infoObj) {
    const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
    const restController = router.restController;

    let template;

    let success = 0, fail = 0, errors = [];

    try {
      template = await restController.ModelExecute(
        "emailTemplate",
        "findOne",
        {tag: templateTag}, //search criteria
      );

      if (!template) {
        throw new Error(`Template not found ${templateTag}`);
      }
    } catch(err) {
      errors.push(err);
      return {success, fail, errors};
    }

    let content = template.content;
    for (const i in infoObj) {
      const reg = new RegExp(`{{${i}}}`, 'g');
      content = content.replace(reg, infoObj[i]);
    }

    content = content.replace(/http(s)?:\/\/(http(s)?:\/\/)/g, '$2');

    const result = await this.sendEmail(template.fromEmail, to, template.subject, content);
    return result;
  }

  async sendEmail(from, to, subject, content) {
    let success = 0, fail = 0, errors = [];

    if (!from) {
      const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
      const restController = router.restController;
  
      try {
        const setting = await restController.ModelExecute(
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
        return {success, fail, errors};
      }
    }

    // deduplicate
    const uniqSet = new Set(to);
    const uniqArr = [...uniqSet];

    function sendEmailPromise(num, parameters) {
      const promise = new Promise( (resolve, reject) => {
        new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(parameters).promise().then(
          (re) => {
            resolve({result: 'success', num});
          }
        ).catch(
          (er) => {
            resolve({result: 'fail', num, error: er});
          }
        );
      });
      return promise;
    }

    const recipientsPerGroup = 45; //AWS limit is 50
    const groupNum = Math.floor(uniqArr.length / recipientsPerGroup) + 1;
    
    const promises = [];
    for (let i = 0; i < groupNum; i++) {
      const start = i * recipientsPerGroup;
      const end = (i + 1) * recipientsPerGroup;
      const grp = uniqArr.slice(start, end);
      // Create sendEmail params 
      const params = {
        Destination: { /* required */
          CcAddresses: [
            /* more items */
          ],
          ToAddresses: uniqArr.length > 1 ? [] : grp, // array
          BccAddresses: uniqArr.length > 1 ? grp : [], // array
        },
        Message: { /* required */
          Body: { /* required */
            Html: {
            Charset: "UTF-8",
            Data: content,
            },
            Text: {
            Charset: "UTF-8",
            Data: content,
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          }
          },
        Source: from, /* required */
        /*
        ReplyToAddresses: [
          'EMAIL_ADDRESS',
          // more items 
        ],
        */
      };
      promises.push(sendEmailPromise(grp.length, params));
    }

    // will not throw errors - see above sendEmailPromise funciton
    const results = await Promise.all(promises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.result === "success") {
        success += result.num;
      } else if (result.result === "fail") {
        fail += result.num;
        errors.push(result.error);
      }
    }
    return {success, fail, errors};
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
