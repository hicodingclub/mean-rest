let warningNumber = 0;
let errorNumber = 0;

function increaseError() {
  errorNumber += 1;
}
function increaseWarning() {
  warningNumber += 1;
}

class Logger {
  static error(msg) {
    console.error('!!!!!!Error:');
    console.error(`     ${msg}`);
    increaseError();
  }
  static warning(msg) {
    console.error('------Warning:');
    console.error(`     ${msg}`);
    increaseWarning();
  }
  static warn(msg) {
    Logger.warning(msg);
  }
  static statistics() {
    return [warningNumber, errorNumber];
  }
}

module.exports = Logger;
