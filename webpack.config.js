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
  'BASE': false,
  'INIT': false,
  'WORKER_EMBED': false,
  'WORKER_INIT': false,
}

for (var key in defaults) {
  var val = defaults[key]

  if (key in kernelConf) {
    val = kernelConf[key]
  }

  defines["KERNEL_CONFIG_" + key] = JSON.stringify(val)
}

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
      { test: /\.jsx?$/, exclude: /(node_modules)/, loader: 'babel',
        query: {
          plugins: [
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
            new transformRuntime({
              "polyfill": false,
              "regenerator": true
            })
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
  },
  plugins: [
    new webpack.DefinePlugin(defines)
  ]
};
