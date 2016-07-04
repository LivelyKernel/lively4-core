'use strict';

const path = require('path'),
  webpack = require('webpack')

let config = {
  CLIENT_BASE: false,
  WORKER_BASE: false,
  LOADER_TRANSPILE: false,
  CLIENT_ENABLED: false,
  CLIENT_INIT: false,
  WORKER_ENABLED: false,
  WORKER_INIT: false,
  WORKER_EMBED: false,
}

if (process.env.KERNEL_CONFIG) {
  Object.assign(config, require(process.env.KERNEL_CONFIG))
} else {
  Object.assign(config, require('./kernel.conf.js'))
}

const defines = Object.keys(config).reduce((prev, cur) => {
  prev['KERNEL_CONFIG.' + cur] = config[cur]
  return prev
}, {})

console.log(defines)

module.exports = {
  target: 'web',
  context: path.resolve(__dirname),
  entry: {
    'kernel': ['./src/boot.js']
  },
  output: {
    path: __dirname,
    filename: "dist-kernel.js"
  },
  resolve: {
    alias: {
      'babel-runtime': path.resolve(__dirname, 'node_modules/babel-runtime')
    }
  },
  devtool: 'inline-source-map',
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /(node_modules)/, loader: 'babel' },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  node: {
    fs: 'empty',
    module: 'empty',
    net: 'empty'
  },
  babel: {
    comments: false,
    babelrc: false,
    plugins: [
      ["transform-define", defines],
      "syntax-async-functions",
      "syntax-async-generators",
      "syntax-class-properties",
      "syntax-decorators",
      "syntax-do-expressions",
      "syntax-exponentiation-operator",
      "syntax-export-extensions",
      "syntax-function-bind",
      "syntax-object-rest-spread",
      "syntax-trailing-function-commas",
      "transform-async-to-generator",
      "transform-async-to-module-method",
      "transform-class-properties",
      "transform-decorators-legacy",
      "transform-do-expressions",
      "transform-es2015-destructuring",
      "transform-es2015-modules-commonjs",
      "transform-exponentiation-operator",
      "transform-export-extensions",
      "transform-function-bind",
      "transform-object-rest-spread",
      // ["transform-runtime", {"polyfill": false, "regenerator": true}],
      "transform-dead-code-elimination",
    ]
  },
};
