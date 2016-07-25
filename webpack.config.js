var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'src/client/public');
var APP_DIR = path.resolve(__dirname, 'src/client/app');

var config = {
  entry: APP_DIR + '/index.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
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