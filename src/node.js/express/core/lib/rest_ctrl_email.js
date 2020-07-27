function emailAllErrorExternal(req, res, next, emailAllResult, err) {
  if (
    emailAllResult.success + emailAllResult.fail + emailAllResult.queuing >
    0
  ) {
    emailAllResult.error = err;
    return res.send(emailAllResult);
  }
  return next(err);
}

function emailAllCheckExternal(req, restController) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      throw createError(400, 'Bad document in body.');
    }
  }
  const actionData = body ? body.actionData : {};

  const {
    emailInput,
    emailTemplate,
    subject,
    content,
    emailFields,
  } = actionData;

  let badRequest = false;
  if (emailInput === 'template') {
    if (!emailTemplate) {
      badRequest = true;
    }
  } else if (emailInput === 'compose') {
    if (!subject || !content) {
      badRequest = true;
    }
  } else {
    badRequest = true;
  }

  if (badRequest) {
    throw createError(400, 'Bad action data for emailing');
  }

  const { emailer, emailerObj } = restController.mddsProperties || {};
  if (!emailer) {
    throw createError(503, 'Emailing service is not available');
  }
  return actionData;
}

async function emailAllExternal(req, rows, restController) {
  const {
    emailInput,
    emailTemplate,
    subject,
    content,
    emailFields,
  } = emailAllCheckExternal(req, restController);

  const { emailer, emailerObj, replacement } =
    restController.mddsProperties;

  const recipients = [];
  const substitutions = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < emailFields.length; j++) {
      const emailField = emailFields[j];
      const eml = rows[i][emailField];
      if (eml) {
        recipients.push(eml);
        substitutions.push(rows[i]);
      }
    }
  }

  // filter emails and send
  try {
    let result;
    if (emailInput === 'template') {
      result = await emailer.sendEmailTemplate(
        recipients,
        emailTemplate,
        replacement || emailerObj || {},
        substitutions
      );
    } else {
      result = await emailer.sendEmail(
        undefined,
        recipients,
        subject,
        content,
        replacement || emailerObj || {},
        substitutions
      );
    }
    // result: {success: 1, fail: 0, queuing: 1, errors: []}
    let err = new Error(`Email send failed: unknown error.`);
    if (result.errors.length > 0) {
      err = result.errors[0];
    }
    if (result.success + result.fail + result.queuing > 0) {
      return {
        success: result.success,
        queuing: result.queuing,
        fail: result.fail,
        error: err,
      };
    } else {
      throw err;
    }
  } catch (err2) {
    throw err2;
  }
}

module.exports = {
  emailAllCheckExternal,
  emailAllErrorExternal,
  emailAllExternal,
};
