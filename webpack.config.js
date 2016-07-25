var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'dist');
var APP_DIR = path.resolve(__dirname, 'src/client/app');
var JSNEXT_MAIN = path.resolve(__dirname, require('./package.json')['jsnext:main']);

var config = {
  entry: JSNEXT_MAIN,
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  devtool: "inline-source-map",
  module : {
    loaders : [
      {
        test: /\.(jsx|js)$/,
        exclude : [
          /node_modules/
        ],
        loader : 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: [
      "", ".webpack.js", ".web.js", ".js", //default
      ".jsx"
    ],
    alias: {
      actions: APP_DIR + "/actions",
      components: APP_DIR + "/components",
      constants: APP_DIR + "/constants",
      containers: APP_DIR + "/containers",
      reducers: APP_DIR + "/reducers",
      base: APP_DIR
    }
  }
};

module.exports = config;