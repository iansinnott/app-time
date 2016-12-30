/**
 * Borrowed from Create React App:
 * https://github.com/facebookincubator/create-react-app/blob/master/packages/react-dev-utils/clearConsole.js
 */
module.exports = function clearConsole() {
  process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H');
};
