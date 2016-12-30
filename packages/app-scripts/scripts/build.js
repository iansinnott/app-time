// Make sure everything is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:build'); // eslint-disable-line no-unused-vars
const ora = require('ora');

const config = require('../config/webpack.config.prod.js');
const { prodOptions: statsOptions } = require('../config/stats.js');

// Print out errors
function printErrors(summary, errors) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

const build = () => {
  const spinner = ora('Compiling...').start();

  webpack(config).run((err, stats) => {
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
