const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const rupture = require('rupture');
const ReactStaticPlugin = require('react-static-webpack-plugin');
const autoprefixer = require('autoprefixer');
const debug = require('debug')('app-time:app-scripts:config:prod'); // eslint-disable-line no-unused-vars

const { resolveApp, ownNodeModules } = require('../utils/paths.js');

debug('resolving loaders to:', ownNodeModules);
debug('resolving everything else to:', resolveApp('./'));

const routes = resolveApp('./client/routes.js');
const template = resolveApp('./template.js');

debug('declared routes file', routes)
debug('declared template file', template)

const reactStaticPlugin = new ReactStaticPlugin({
  routes: routes,
  template: template,
});

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

    // reactStaticPlugin,
  ],

  resolveLoader: {
    modules: [ownNodeModules], // Is this `root`?
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: resolveApp('./node_modules'),
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader',
        }),
      },
      {
        test: /\.styl$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: [
            {
              loader: 'css-loader',
              options: {
                module: true,
                importLoaders: 2,
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
