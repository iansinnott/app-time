const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const rupture = require('rupture');
const ReactStaticPlugin = require('react-static-webpack-plugin');
const autoprefixer = require('autoprefixer');
const chalk = require('chalk');
const debug = require('debug')('app-time:app-scripts:config:prod'); // eslint-disable-line no-unused-vars

const { resolveApp, ownNodeModules } = require('../utils/paths.js');

debug('resolving loaders to:', ownNodeModules);
debug('resolving everything else to:', resolveApp('./'));

const staticRoutes = resolveApp('./client/routes.js');
const staticTemplate = resolveApp('./template.js');

debug('declared routes file', staticRoutes);
debug('declared template file', staticTemplate);

// Assert this just to be safe.
if (process.env.NODE_ENV !== 'production') {
  console.log(
    `Production builds must have ${chalk.underline('NODE_ENV=production')}. Try:

    ${chalk.cyan('$ NODE_ENV=production app-time build')}
    `
  );
  throw new Error('Tried to build for production in non-production environment.');
}

module.exports = {
  devtool: 'source-map',

  entry: {
    app: [
      'normalize.css',
      resolveApp('./client/index.js'),
    ],
  },

  output: {
    path: resolveApp('./build'),
    filename: '[name].js',
    publicPath: '/',
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      options: {
        postcss: [autoprefixer({ browsers: ['last 2 versions'] })],
        stylus: {
          use: [rupture()],
        },
      },
    }),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      screw_ie8: true,
      sourceMap: true,
      compressor: { warnings: false },
    }),
    new ReactStaticPlugin({
      routes: staticRoutes,
      template: staticTemplate,
    }),
  ],

  // Enable performance warning hints in prod mode
  performance: {
    hints: true
  },

  // NOTE: We try to resolve loaders first locally then within the app
  // directory. This issue mainly arrose during development using
  // yarn link app-time. In practice because of dependency flattening the
  // loaders will mostly likely be found in the user-app's node_modules
  resolveLoader: {
    modules: [
      ownNodeModules,
      resolveApp('./node_modules'),
    ],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: resolveApp('./node_modules'),
        loader: 'babel-loader',
        query: {
          babelrc: false,
          presets: [
            ['babel-preset-es2015', { modules: false }],
            'babel-preset-react',
            'babel-preset-stage-1',
          ],
        },
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: [
            { loader: 'css-loader' },
          ],
        }),
      },
      {
        test: /\.styl$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: [
            {
              loader: 'css-loader',
              query: {
                modules: true,
                importLoaders: 2,
                localIdentName: '[hash:base64:8]',
              },
            },
            { loader: 'postcss-loader' },
            { loader: 'stylus-loader' },
          ],
        }),
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 10000, mimetype: 'mimetype=application/font-woff' },
          },
        ],
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        use: [
          { loader: 'file-loader', options: { name: '[name].[ext]' } },
        ],
      },
    ],
  },
};
