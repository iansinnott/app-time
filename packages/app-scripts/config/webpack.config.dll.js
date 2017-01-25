const webpack = require('webpack');
const path = require('path');
const debug = require('debug')('app-time:app-scripts:config:dll'); // eslint-disable-line no-unused-vars

const { apptimeTempDir, resolveApp } = require('../utils/paths.js');
const getVendorLibs = require('../utils/getVendorLibs.js');

// The name of the global variable output in the dll file
const dllVarname = '[name]_dll_[hash]';

// The app-time consumer's package.json
const pkg = require(resolveApp('./package.json'));

module.exports = {
  devtool: 'eval',

  context: process.cwd(),

  entry: {
    vendor: getVendorLibs(pkg),
  },

  output: {
    path: apptimeTempDir,
    filename: '[name].dll.js',
    library: dllVarname,
  },

  plugins: [
    new webpack.DllPlugin({
      path: path.join(apptimeTempDir, '[name]-manifest.json'),
      name: dllVarname,
    }),
  ],

  // Disable any performance warning hints. Not relevant for DLL bundles
  performance: {
    hints: false,
    maxEntrypointSize: 20e6, // 20mb
    maxAssetSize: 20e6, // 20mb
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

  // TODO: I'm not sure yet what the best way to handle this stuff is. In all
  // the examples I saw people didn't use loaders with the DLL plugin. Makes
  // sense... but what if you want to simply pass all dependencies to the dll
  // plugin? You will likely need some loaders.
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
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
