const fs = require('fs');
const path = require('path');

const appDir = fs.realpathSync(process.cwd());
const resolveApp = (relpath) => path.resolve(appDir, relpath);
const resolveOwn = (relpath) => path.resolve(__dirname, relpath);
const ownNodeModules = resolveOwn('../../../node_modules');

module.exports = {
  ownNodeModules, // TODO: This might need to be localized into a app-scripts
  resolveApp,
  resolveOwn,
  resolveOwnModule(request) { return `${ownNodeModules}/${request}`; },
};
