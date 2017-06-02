/**
 * NOTE: This file must be run with babel-node as Node is not yet compatible
 * with all of ES6 and we also use JSX.
 */

// Ensure development builds of all imported modules
process.env.NODE_ENV = 'development';

const fs = require('fs');
const path = require('path');
const React = require('react');
const url = require('url');
const { renderToStaticMarkup } = require('react-dom/server');
const express = require('express');
const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:start'); // eslint-disable-line no-unused-vars
const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const { argv } = require('yargs');

const { resolveApp, apptimeTempDir } = require('../utils/paths.js');
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

debug('argv', argv);

const customConfigPath = resolveApp('apptime.config.dev.js');

/**
 * This takes in the configuration and returns useful default options which can
 * then be passed to the custom configurator function.
 */
const getDefaults = (config) => {
  const hmrEntry = config.entry.app[0];
  return {
    hmrEntry,

    define(defs) {
      const defineIndex = config.plugins.findIndex(x => x instanceof webpack.DefinePlugin);
      const existingDefinitions = config.plugins[defineIndex].definitions;
      const newDefinitions = Object.assign({}, existingDefinitions, defs);
      const plugins = config.plugins.slice();
      plugins[defineIndex] = new webpack.DefinePlugin(newDefinitions);
      debug('Define helper called. New plugins', plugins);
      return Object.assign({}, config, { plugins });
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

if (argv.dashboard) {
  const dashboard = new Dashboard();
  compiler.apply(new DashboardPlugin(dashboard.setData));
}

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

  // Only use the custom reporter if not using dashboard
  reporter: argv.dashboard ? undefined : reporter,
}));

// NOTE: An empty logger is required for the wepback-dashboard plugin
app.use(require('webpack-hot-middleware')(compiler, argv.dashboard ? { log(){} } : undefined));

const dllName = 'vendor.dll.js';

// This seems odd to do. There is likely a better way to send the dll when
// requested
app.get('/vendor.dll.js', (req, res) => {
  const filepath = path.join(apptimeTempDir, dllName);
  res.send(fs.readFileSync(filepath));
});

const serverConfigPath = resolveApp('apptime.config.server.js');
if (fs.existsSync(serverConfigPath)) {
  console.log(`Using custom configurator from: ${chalk.cyan.bold(serverConfigPath)}`);
  console.log();

  require(serverConfigPath)(app);
}

// Send the boilerplate HTML payload down for all get requests. Routing will be
// handled entirely client side and we don't make an effort to pre-render pages
// before they are served when in dev mode.
app.get('*', (req, res) => {
  const { publicPath } = finalConfig.output;

  // Create a mock manifest object to pass to the dev template.
  // TODO: Is this silly? Every user has access to their own template file and
  // they could perform a manual logic branch on process.env.NODE_ENV and decide
  // what path to use for their scripts and css files... Hopefully this isn't
  // too much magic. There's also absolutely no guarantee that the prod manifest
  // would look like the one generated here
  const mockManifest = Object.keys(finalConfig.entry)
    .map(x => [
      `${publicPath}${x}.js`,
      `${publicPath}${x}.css`,
    ])
    .reduce((agg, paths) => {
      paths.forEach(x => { agg[path.basename(x)] = x; });
      return agg;
    }, {});

  // Add the dll as the vendor file. Standardizing this way allows the template
  // to continue to include src={manifest['vendor.js']} in both prod and dev
  // while pointing to different bundles.
  mockManifest['vendor.js'] = `/${dllName}`;

  const html = renderDocumentToString({
    bundle: publicPath + 'app.js',
    manifest: mockManifest,
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
