// This is only for development
process.env.NODE_ENV = 'development';

const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:setup'); // eslint-disable-line no-unused-vars
const ora = require('ora');

const config = require('../config/webpack.config.dll.js');
const { devOptions: statsOptions } = require('../config/stats.js');

// Print out errors
function printErrors(summary, errors) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

/**
 * This takes in the configuration and returns useful utils which can then be
 * passed to the custom configurator function.
 *
 * TODO: Another approach to allow surgical precision in configuring the webpack
 * config would be to use lenses. Just something to think about.
 */
const compileDll = () => {
  const spinner = ora('Compiling DLL...').start();
  const compiler = webpack(config);

  compiler.run((err, stats) => {
    if (err) {
      spinner.fail();
      printErrors('Failed to compile DLL', [err]);
      process.exitCode = 1;
      return;
    }

    if (stats.compilation.errors.length) {
      spinner.fail();
      printErrors('Failed to compile DLL', [stats.compilation.errors]);
      process.exitCode = 1;
      return;
    }

    spinner.text = 'DLL compiled successfully';
    spinner.succeed();

    // Log all stats. Coloring is automatic
    console.log(stats.toString(statsOptions));
    console.log();

    if(stats.hasWarnings()) {
      console.log(chalk.yellow.bold('DLL compiled with warnings.'));
      console.log();
    } else {
      console.log(chalk.green.bold('DLL compilation successful 🎉'));
      console.log();
    }
  });
};

// Kick off the build
compileDll();
