var path = require('path'),
    webpack = require('webpack');

module.exports = {
  target: 'web',
  context: path.resolve(__dirname),
  entry: {
    'kernel': ['babel-polyfill', './src/kernel.js']
  },
  output: {
    path: __dirname,
    filename: "dist-[name].js"
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /(node_modules)/, loader: 'babel',
        query: {
          plugins: [
            "syntax-async-functions",
            "syntax-do-expressions",
            "syntax-function-bind",
            "transform-es2015-modules-commonjs",
            "transform-do-expressions",
            "transform-function-bind",
            "transform-async-to-generator"
          ]
        }
      },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  node: {
    fs: 'empty',
    module: 'empty',
    net: 'empty'
  }
};
