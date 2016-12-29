/**
 * NOTE: This file must be run with babel-node as Node is not yet compatible
 * with all of ES6 and we also use JSX.
 */
const React = require('react');
const url = require('url');
const { renderToStaticMarkup } = require('react-dom/server');
const express = require('express');
const webpack = require('webpack');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:scripts:start'); // eslint-disable-line no-unused-vars

const { resolveApp } = require('../utils/paths.js');
const config = require('../config/webpack.config.dev.js');
const babelRequire = require('../utils/babelRequire.js');
const templatePath = resolveApp('./template.js');

debug('templatePath', templatePath);

let Html;

babelRequire(
  templatePath,
  x => { Html = x; },
  err => {
    debug(`Error requiring template file: ${chalk.cyan(templatePath)}`, err);
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
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath,
}));

app.use(require('webpack-hot-middleware')(compiler));

// Send the boilerplate HTML payload down for all get requests. Routing will be
// handled entirely client side and we don't make an effort to pre-render pages
// before they are served when in dev mode.
app.get('*', (req, res) => {
  const html = renderDocumentToString({
    bundle: config.output.publicPath + 'app.js',
  });
  res.send(html);
});

// NOTE: url.parse can't handle URLs without a protocol explicitly defined. So
// if we parse '//localhost:8888' it doesn't work. We manually add a protocol even
// though we are only interested in the port.
const { port } = url.parse('http:' + config.output.publicPath);

app.listen(port, 'localhost', err => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Dev server listening at ${chalk.cyan(`http://localhost:${port}`)}`);
});
