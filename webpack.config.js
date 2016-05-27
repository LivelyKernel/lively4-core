var path = require('path'),
    webpack = require('webpack'),
    transformRuntime = require('babel-plugin-transform-runtime').default;

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
  }
};
