const debug = require('debug')('app-time:app-scripts:utils:getVendorLibs'); // eslint-disable-line no-unused-vars

const getVendorLibs = exports.getVendorLibs = (pkg) => {
  const hasVendorLibs = pkg.apptime && Array.isArray(pkg.apptime.vendorLibs);
  const defaults = ['core-js', 'classnames/bind', 'history', 'react', 'react-dom', 'react-router'];
  const vendorLibs = hasVendorLibs ? pkg.apptime.vendorLibs : defaults;

  debug('vendorLibs', vendorLibs);

  return vendorLibs;
};

module.exports = getVendorLibs;
