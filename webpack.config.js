const path = require('path'),
  webpack = require('webpack'),
  transformRuntime = require('babel-plugin-transform-runtime').default;

function resolveKernelConfigFile() {
  if (process.env.KERNEL_CONFIG) {
    return path.resolve(process.env.KERNEL_CONFIG)
  } else {
    return path.resolve('./kernel.conf.js')
  }
}

const kernelConfFile = resolveKernelConfigFile()

const defines = {}
const kernelConf = require(kernelConfFile)

const defaults = {
  BASE: false,
  LOADER_TRANSPILE: false,
  CLIENT: false,
  CLIENT_INIT: false,
  WORKER: false,
  WORKER_INIT: false,
  WORKER_EMBED: false,
}

for (var key in defaults) {
  var val = defaults[key]

  if (key in kernelConf) {
    val = kernelConf[key]
  }

  defines['KERNEL_CONFIG_' + key] = JSON.stringify(val)
}

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
      'kernel_conf': kernelConfFile
    }
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /(node_modules)/, loader: 'rollup' },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  node: {
    fs: 'empty',
    module: 'empty',
    net: 'empty'
  },
  plugins: [
    new webpack.DefinePlugin(defines)
  ],
  rollup: [
    require('rollup-plugin-babel')({
      babelrc: false,
      runtimeHelpers: true,
      plugins: [
        require("babel-plugin-syntax-async-functions"),
        require("babel-plugin-syntax-async-generators"),
        require("babel-plugin-syntax-class-properties"),
        require("babel-plugin-syntax-decorators"),
        require("babel-plugin-syntax-do-expressions"),
        require("babel-plugin-syntax-exponentiation-operator"),
        require("babel-plugin-syntax-export-extensions"),
        require("babel-plugin-syntax-function-bind"),
        require("babel-plugin-syntax-object-rest-spread"),
        require("babel-plugin-syntax-trailing-function-commas"),
        require("babel-plugin-transform-async-to-generator"),
        require("babel-plugin-transform-async-to-module-method"),
        require("babel-plugin-transform-class-properties"),
        require("babel-plugin-transform-decorators-legacy").default,
        require("babel-plugin-transform-do-expressions"),
        require("babel-plugin-transform-es2015-destructuring"),
        // require("babel-plugin-transform-es2015-modules-commonjs"),
        require("babel-plugin-transform-exponentiation-operator"),
        require("babel-plugin-transform-export-extensions"),
        require("babel-plugin-transform-function-bind"),
        require("babel-plugin-transform-object-rest-spread"),
      ]
    })
  ]
};
