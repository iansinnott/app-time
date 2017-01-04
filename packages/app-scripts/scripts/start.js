/**
 * NOTE: This file must be run with babel-node as Node is not yet compatible
 * with all of ES6 and we also use JSX.
 */

// Ensure development builds of all imported modules
process.env.NODE_ENV = 'development';

const fs = require('fs');
const React = require('react');
const url = require('url');
const { renderToStaticMarkup } = require('react-dom/server');
const express = require('express');
const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:start'); // eslint-disable-line no-unused-vars

const { resolveApp } = require('../utils/paths.js');
const babelRequire = require('../utils/babelRequire.js');
const clearConsole = require('../utils/clearConsole.js');
const config = require('../config/webpack.config.dev.js');
const { devOptions: statsOptions } = require('../config/stats.js');
const templatePath = resolveApp('./template.js');

// NOTE: url.parse can't handle URLs without a protocol explicitly defined. So
// if we parse '//localhost:8888' it doesn't work. We manually add a protocol even
// though we are only interested in the port.
const { port } = url.parse('http:' + config.output.publicPath);

const isInteractive = process.stdout.isTTY;
const isDebug = !!process.env.DEBUG;
const shouldClearConsole = isInteractive && !isDebug;

if (shouldClearConsole) clearConsole();
console.log('Initializing dev server...');

const customConfigPath = resolveApp('apptime.config.dev.js');

/**
 * This takes in the configuration and returns useful default options which can
 * then be passed to the custom configurator function.
 */
const getDefaults = (config) => {
  const hmrEntry = config.entry.app[0];
  return {
    hmrEntry,
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

let Html;
babelRequire(
  templatePath,
  x => { Html = x; },
  err => {
    debug(`Error requiring file: ${chalk.cyan.bold(templatePath)}`, err);
    console.log(chalk.red(`Error: Could not parse template file at "${templatePath}".`));
    console.log();
    process.exit(1);
  }
);

/**
 * Render the entire web page to a string. We use render to static markup here
 * to avoid react hooking on to the document HTML that will not be managed by
 * React. The body prop is a string that contains the actual document body,
 * which react will hook on to.
 *
 * We also take this opportunity to prepend the doctype string onto the
 * document.
 *
 * @param {object} props
 * @return {string}
 */
const renderDocumentToString = props => {
  return '<!doctype html>' +
    renderToStaticMarkup(React.createElement(Html, props));
};

const app = express();
const compiler = webpack(finalConfig);

/**
 * state: boolean. Indicates completion of the compilation.
 * stats: Object. Webpack stats: https://webpack.github.io/docs/node.js-api.html#stats-tojson
 * options: Object. The options passed to the dev server, of which this reporter is itself a part.
 *
 * NOTE: I renamed state for semantic reasons. I thought it was unclear what
 * "state" meant.
 */
const reporter = ({ state, stats, options }) => {
  const isComplete = !!state; // See NOTE

  if (!isComplete) {
    console.log(chalk.yellow('Compiling...'));
    console.log();
    return;
  }

  if (shouldClearConsole) clearConsole();

  console.log(`Dev server listening at ${chalk.cyan.bold(`http://localhost:${port}`)}`);
  console.log();

  // Log all stats. Coloring is automatic
  console.log(stats.toString(statsOptions));
  console.log();

  if(stats.hasErrors()) {
    console.log(chalk.red.bold('Failed to compile.'));
    console.log();
  } else if(stats.hasWarnings()) {
    console.log(chalk.yellow.bold('Compiled with warnings.'));
    console.log();
  }
};

app.use(require('webpack-dev-middleware')(compiler, {
  publicPath: finalConfig.output.publicPath,

  // Silence default output and add custom reporter (Not sure if the silencing
  // part actually works...)
  noInfo: true,
  quiet: true,
  reporter,
}));

app.use(require('webpack-hot-middleware')(compiler));

// Send the boilerplate HTML payload down for all get requests. Routing will be
// handled entirely client side and we don't make an effort to pre-render pages
// before they are served when in dev mode.
app.get('*', (req, res) => {
  const html = renderDocumentToString({
    bundle: finalConfig.output.publicPath + 'app.js',
  });
  res.send(html);
});

// Start the dev server
app.listen(port, 'localhost', err => {
  if (err) {
    console.error(err);
    return;
  }

  // Logging is handled in the webpack-dev-middleware reporter
});
