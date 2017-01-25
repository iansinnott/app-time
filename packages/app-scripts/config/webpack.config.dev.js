const webpack = require('webpack');
const path = require('path');
const rupture = require('rupture');
const autoprefixer = require('autoprefixer');
const debug = require('debug')('app-time:app-scripts:config:dev'); // eslint-disable-line no-unused-vars

const {
  resolveApp,
  ownNodeModules,
  apptimeTempDir,
} = require('../utils/paths.js');

// Set up dev host. We do this so that it's possible to configure the URL our
// script tag gets in dev mode. For instance if running the dev server in a
// VirtualBox VM we can do this: $ DEV_HOSTNAME=10.0.2.2 app-time start
// And we end up with a script tag in the template that points to
// '//10.0.2.2:3000'. That IP address just happens to be address of localhost on
// the host machine within a VB virtual machine.
const DEV_PORT = process.env.DEV_PORT || 3000;
const DEV_HOSTNAME = process.env.DEV_HOSTNAME || 'localhost';

// In case the user wants to they can specify the entire host in one varaible.
const DEV_HOST = process.env.DEV_HOST || `//${DEV_HOSTNAME}:${DEV_PORT}/`;

// NOTE: Appending __webpack_hmr to the dev host is what allows HMR to work. For
// more details see: https://github.com/glenjamin/webpack-hot-middleware/issues/37
module.exports = {
  devtool: 'cheap-module-eval-source-map',

  entry: {
    app: [
      `webpack-hot-middleware/client?path=${DEV_HOST}__webpack_hmr`, // See note above
      resolveApp('./client/index.js'),
    ],
  },

  // TODO: How are we even using this output path? This config is only used for
  // dev server
  output: {
    path: resolveApp('./build'),
    filename: '[name].js',
    publicPath: DEV_HOST,
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [autoprefixer({ browsers: ['last 2 versions'] })],
        stylus: {
          use: [rupture()],
        },
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
    new webpack.DllReferencePlugin({
      context: resolveApp('.'),
      manifest: path.join(apptimeTempDir, 'vendor-manifest.json'),
    }),
  ],

  // Disable performance warning hints in dev mode
  performance: {
    hints: false,
    maxEntrypointSize: 20e6, // 20mb
    maxAssetSize: 20e6, // 20mb
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

  // Also resolve modules in web_modules. This is meant for user defined
  // modules, and was the default with webpack 1. It appears that in webpack 2
  // it was removed so I've reinstated it.
  resolve: {
    modules: [
      'web_modules',
      'node_modules',
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
          env: {
            development: {
              presets: ['babel-preset-react-hmre'],
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.styl$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            query: {
              modules: true,
              importLoaders: 2,
              localIdentName: '[name]__[local]__[hash:base64:6]',
            },
          },
          { loader: 'postcss-loader' },
          { loader: 'stylus-loader' },
        ],
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
