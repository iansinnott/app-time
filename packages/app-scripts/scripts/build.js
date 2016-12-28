const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:build'); // eslint-disable-line no-unused-vars

const config = require('../config/webpack.config.prod.js');

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
  webpack(config).run((err, stats) => {
    if (err) {
      printErrors('Failed to compile', [err]);
      process.exitCode = 1;
      return;
    }

    if (stats.compilation.errors.length) {
      printErrors('Failed to compile', [stats.compilation.errors]);
      process.exitCode = 1;
      return;
    }

    console.log(chalk.green('Compiled successfully.'));
    console.log();
  });
};

// Kick off the build
build();
