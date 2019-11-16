let commonInfo = {
  serverUrl: 'http://localhost:3000',
  serverUrlPasswordReset: 'http://localhost:3000/auth/reset/',
};

const templates = [
  {
    templateName: 'Reset Password',
    fromEmail: 'sampleemailxibinliu@gmail.com',
    subject: 'Reset Password',
    content: 'Dear {{userName}}<br/>Please reset your password following the instructions in this link: {{link}}.',
    tag: 'resetpassword',
  },
];


module.exports = {
  commonInfo,
  templates,
}