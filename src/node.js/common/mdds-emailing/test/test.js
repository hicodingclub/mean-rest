const { configAWSFromPath, sendEmail } = require('../index');

configAWSFromPath('./ses.json');

sendEmail(
  'sampleemailxibinliu@gmail.com',
  ['xibinliu@yahoo.com'],
  'Hello',
  'Hello, welcome!',
)
.then(result => {
  console.log('Send email result: ', result);
})
.catch(err => {
  console.log('Send error: ', err);
});