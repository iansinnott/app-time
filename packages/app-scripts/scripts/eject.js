const path = require('path');
const fs = require('fs');
const debug = require('debug')('app-time:app-scripts:scripts:eject'); // eslint-disable-line no-unused-vars
const { argv } = require('yargs');

const { resolveApp, resolveOwn } = require('../utils/paths.js');
const prompt = require('../utils/prompt.js');

const writeFileSync = (...args) => {
  const [ filepath ] = args;

  if (argv.dryRun) {
    console.log(`DRY RUN: Not writing file ${filepath}`);
    return;
  }

  console.log(`Writing ${filepath}`);
  fs.writeFileSync(...args);
};

const mkdirSync = (...args) => {
  if (argv.dryRun) {
    const [ dirpath ] = args;
    console.log(`DRY RUN: Not writing directory ${dirpath}`);
    return;
  }

  fs.mkdirSync(...args);
};

prompt(
  'Are you sure? This cannot be undone.',
  true
).then(shouldEject => {
  if (!shouldEject) {
    console.log('OK. No changes were made.');
    console.log();
    return;
  }

  console.log('Ejecting...');
  console.log();

  // Still pondering this. What would be a good name for the output dir? Since
  // we're ejecting it doesn't make much sense to keep the apptime moniker
  // around.
  const OUT_CONFIG_DIRNAME = 'apptime';

  const files = [
    path.join('config', 'webpack.config.dev.js'),
    path.join('config', 'webpack.config.prod.js'),
    path.join('config', 'webpack.config.dll.js'),
    path.join('config', 'stats.js'),
    path.join('utils', 'babelRequire.js'),
    path.join('utils', 'clearConsole.js'),
    path.join('utils', 'getVendorLibs.js'),
    path.join('utils', 'paths.js'),
    path.join('scripts', 'build.js'),
    path.join('scripts', 'start.js'),
    path.join('scripts', 'setup.js'),
  ];

  const ownPaths = files.map(x => path.resolve(__dirname, '..', x));
  debug('ownPaths', ownPaths);

  const appPaths = files.map(x => resolveApp(OUT_CONFIG_DIRNAME, x));
  debug('appPaths', appPaths);

  appPaths.forEach(filepath => {
    if (fs.existsSync(filepath)) {
      console.error(
        '`' + filepath + '` already exists in your app folder. We cannot ' +
        'continue as you would lose all the changes in that file or directory. ' +
        'Please delete it (maybe make a copy for backup) and run this ' +
        'command again.'
      );
      process.exit(1);
    }
  });

  mkdirSync(resolveApp(OUT_CONFIG_DIRNAME));
  mkdirSync(resolveApp(OUT_CONFIG_DIRNAME, 'config'));
  mkdirSync(resolveApp(OUT_CONFIG_DIRNAME, 'utils'));
  mkdirSync(resolveApp(OUT_CONFIG_DIRNAME, 'scripts'));

  appPaths.forEach((filepath, i) => {
    const ownFilepath = ownPaths[i];
    const content = fs
      .readFileSync(ownFilepath, 'utf8')
      .replace(/\/\/ @remove-on-eject-begin([\s\S]*?)\/\/ @remove-on-eject-end/mg, '')
      .trim() + '\n';

    writeFileSync(filepath, content);
  });

  const ownPackage = require(resolveOwn('package.json'));
  const appPackage = require(resolveApp('package.json'));

  Object.keys(ownPackage.dependencies).forEach((k) => {
    console.log(`Adding dependency "${k}"`);
    appPackage.devDependencies[k] =  ownPackage.dependencies[k];
  });

  console.log('Updating scripts');
  delete appPackage.scripts.eject;
  Object.keys(appPackage.scripts).forEach(k => {
    appPackage.scripts[k] = appPackage.scripts[k]
      .replace(/app-time (\w+)/g, `node ${OUT_CONFIG_DIRNAME}/scripts/$1.js`);
  });

  writeFileSync(
    resolveApp('package.json'),
    JSON.stringify(appPackage, null, 2)
  );

  if (argv.dryRun) {
    console.log('DRY RUN: Complete. Nothing changed');
    console.log();
  } else {
    console.log('Ejected successfully. You should run either `npm install` or `yarn install` depending on what you use to finalize the ejection.');
    console.log();
  }
});
