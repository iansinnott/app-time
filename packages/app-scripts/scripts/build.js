// Make sure everything is running in production mode
process.env.NODE_ENV = 'production';

const fs = require('fs');
const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:build'); // eslint-disable-line no-unused-vars
const ora = require('ora');
const { argv } = require('yargs');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const config = require('../config/webpack.config.prod.js');
const { prodOptions: statsOptions } = require('../config/stats.js');
const { resolveApp } = require('../utils/paths.js');
const babelRequire = require('../utils/babelRequire.js');

// Print out errors
function printErrors(summary, errors) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

debug('argv', argv);

const customConfigPath = resolveApp('apptime.config.prod.js');

/**
 * This takes in the configuration and returns useful default options which can
 * then be passed to the custom configurator function.
 */
const getDefaults = (config) => {
  const polyfill = config.entry.app[0];
  return {
    hmrEntry: null,
    polyfill,
  };
};

let finalConfig = config;
if (fs.existsSync(customConfigPath)) {
  console.log(`Using custom configurator from: ${chalk.cyan.bold(customConfigPath)}`);
  console.log();

  const handleFailure = err => {
    debug(`Error requiring file: ${chalk.cyan.bold(customConfigPath)}`, err);
    console.log(chalk.red(`Error: Could not parse config file at "${customConfigPath}".`));
    console.log();
    process.exit(1);
  };

  try {
    babelRequire(
      customConfigPath,
      configure => { finalConfig = configure(config, getDefaults(config)); },
      handleFailure
    );
  } catch (err) {
    handleFailure(err);
  }
}

const build = () => {
  const spinner = ora('Compiling...').start();
  const compiler = webpack(finalConfig);

  // Add the analyzer plugin if the user requests it with the --analyze flag
  if (argv.analyze) {
    debug('Applying BundleAnalyzerPlugin...');
    compiler.apply(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'webpack-bundle-analyzer-report.html',
      generateStatsFile: true, // Output stats.json in case the user wants to do something with it
      statsFilename: 'webpack-bundle-analyzer-stats.json',
    }));
  }

  compiler.run((err, stats) => {
    if (err) {
      spinner.fail();
      printErrors('Failed to compile', [err]);
      process.exitCode = 1;
      return;
    }

    if (stats.compilation.errors.length) {
      spinner.fail();
      printErrors('Failed to compile', [stats.compilation.errors]);
      process.exitCode = 1;
      return;
    }

    spinner.text = 'Compiled successfully';
    spinner.succeed();

    // Log all stats. Coloring is automatic
    console.log(stats.toString(statsOptions));
    console.log();

    if(stats.hasWarnings()) {
      console.log(chalk.yellow.bold('Compiled with warnings.'));
      console.log();
    } else {
      console.log(chalk.green.bold('Compilation successful 🎉'));
      console.log();
    }
  });
};

// Kick off the build
build();
