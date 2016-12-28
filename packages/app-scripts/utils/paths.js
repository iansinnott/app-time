const fs = require('fs');
const path = require('path');

const appDir = fs.realpathSync(process.cwd());
const resolveApp = (relpath) => path.resolve(appDir, relpath);
const resolveOwn = (relpath) => path.resolve(__dirname, relpath);

module.exports = {
  resolveApp,
  resolveOwn,
  ownNodeModules: resolveOwn('../../../node_modules'), // TODO: This might need to be localized into a app-scripts
};
