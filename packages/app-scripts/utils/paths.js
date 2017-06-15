const fs = require('fs');
const path = require('path');

const appDir = fs.realpathSync(process.cwd());
const resolveApp = (...relpaths) => path.resolve(appDir, ...relpaths);
const resolveOwn = (...relpaths) => path.resolve(__dirname, '../../../', ...relpaths);
const ownNodeModules = resolveOwn('node_modules');
const apptimeTempDir = resolveApp('./.apptime');

module.exports = {
  ownNodeModules, // TODO: This might need to be localized into a app-scripts
  resolveApp,
  resolveOwn,
  apptimeTempDir,
};
