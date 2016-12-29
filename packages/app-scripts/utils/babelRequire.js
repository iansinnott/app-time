const vm = require('vm');
const m = require('module');
const path = require('path');
const babel = require('babel-core');

// NOTE: These options are duplicated elsewhere. Might be a good idea to
// refactor into a config file
const babelOptions = {
  babelrc: false,
  presets: [
    ['babel-preset-es2015', { modules: false }],
    'babel-preset-react',
    'babel-preset-stage-1',
  ],
};

/**
 * Transpile the code at the given filepath and then evaluate it. Return the
 * module.exports of the result.
 *
 * There must be a more straightforward way to do this, but for now it works.
 * Passing in a temporary _module object to capture the output assigned by the
 * transpiled code seems very hacky.
 *
 * NOTE: filepath must be absolute
 */
const babelRequire = (filepath, success, failure) => {
  try {
    const transpiled = babel.transformFileSync(filepath, babelOptions);
    const _module = {};
    vm.runInThisContext(m.wrap(transpiled.code), {
      filename: path.basename(filepath),
      displayErrors: true,
    })(exports, require, _module, __filename, __dirname);
    success(_module.exports);
  } catch (err) {
    failure(err);
  }
};

module.exports = babelRequire;
