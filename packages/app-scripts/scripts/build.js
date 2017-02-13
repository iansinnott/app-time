// Make sure everything is running in production mode
process.env.NODE_ENV = 'production';

const fs = require('fs');
const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:build'); // eslint-disable-line no-unused-vars
const ora = require('ora');
const { argv } = require('yargs');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactStaticPlugin = require('react-static-webpack-plugin');

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
 * This takes in the configuration and returns useful utils which can then be
 * passed to the custom configurator function.
 *
 * TODO: Another approach to allow surgical precision in configuring the webpack
 * config would be to use lenses. Just something to think about.
 */
const getApptimeUtils = (config) => {
  const polyfill = config.entry.app[0];
  return {
    hmrEntry: null,
    polyfill,

    define(defs) {
      const index = config.plugins.findIndex(x => x instanceof webpack.DefinePlugin);
      const existingDefinitions = config.plugins[index].definitions;
      const newDefinitions = Object.assign({}, existingDefinitions, defs);
      config.plugins[index] = new webpack.DefinePlugin(newDefinitions);
      debug('Define helper called. New plugins', config.plugins);
      return config;
    },

    // This is important if the user wants use redux. In order to specify the
    // store the user needs to be able to configure the plugin
    ReactStaticPlugin(options) {
      debug('ReactStaticPlugin provided with options', options);
      const index = config.plugins.findIndex(x => x instanceof ReactStaticPlugin);
      config.plugins[index] = new ReactStaticPlugin(options);
      return config;
    },
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
      configure => { finalConfig = configure(config, getApptimeUtils(config)); },
      handleFailure
    );
  } catch (err) {
    handleFailure(err);
  }
}

const build = () => {
  const spinner = ora('Compiling...').start();

  debug('Final Webpack config:', finalConfig);

  const compiler = webpack(finalConfig);

  // Add the analyzer plugin if the user requests it with the --analyze flag
  if (argv.analyze) {
    debug('Applying BundleAnalyzerPlugin...');
    compiler.apply(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'webpack-bundle-analyzer-report.html',
      generateStatsFile: true, // Output stats.json in case the user wants to do something with it
      statsFilename: 'webpack-bundle-analyzer-stats.json',
      openAnalyzer: false, // Do not open browser on completion
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
