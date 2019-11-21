const AWS = require('aws-sdk');
const meanRestExpress = require('@hicoder/express-core');

const emailSystemDef = require('./model');

class MddsEmailer {
  constructor(configJsonFile) {
    this.configJsonFile = configJsonFile;
    AWS.config.loadFromPath(configJsonFile);;
  }

  populateTemplatesToDB(templates) {
    const router =  meanRestExpress.RestRouter(emailSystemDef, 'internal-template-usage');
    const restController = router.restController;

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
    const router =  meanRestExpress.RestRouter(emailTemplateDef, 'internal-template-usage');
    const restController = router.restController;

    let template;
    let msg = '';
    await restController.ModelExecute(
      "emailTemplate",
      "findOne",
      {tag: templateTag}//search criteria
    ).then(
      function(result) {
        if (result) template = result;
      }, 
      function (err) {
        msg = err.message;;
      }
    );

    if (!template) {
      return new Promise(function(resolve, reject) {
        const err = new Error(`Template not found. ${msg}`);
        reject(err);
      });
    }

    let content = template.content;
    for (const i in infoObj) {
      const reg = new RegExp(`{{${i}}}`, 'g');
      content = content.replace(reg, infoObj[i]);
    }

    content = content.replace(/http(s)?:\/\/(http(s)?:\/\/)/g, '$2');

    // Create sendEmail params 
    const params = {
      Destination: { /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: to, // array
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
          Data: template.subject,
        }
        },
      Source: template.fromEmail, /* required */
      /*
      ReplyToAddresses: [
        'EMAIL_ADDRESS',
        // more items 
      ],
      */
    };
    // Create the promise and SES service object
    const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
    return sendPromise;
  }

  sendEmail(from, to, subject, content) {
    // Create sendEmail params 
    const params = {
      Destination: { /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: to, // array
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
    // Create the promise and SES service object
    const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
    return sendPromise;
  }
}

//used to manage the public access
function GetEmailingManageRouter(moduleName, authAppFuncs) {
  const router =  meanRestExpress.RestRouter(emailSystemDef, moduleName, authAppFuncs);
  return router;
}

module.exports = {
  GetEmailingManageRouter,
  MddsEmailer,
};