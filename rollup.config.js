import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'
import replace from 'rollup-plugin-replace'
import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

import path from 'path'

let config = {
  BASE: false,
  LOADER_TRANSPILE: false,
  CLIENT: false,
  CLIENT_INIT: false,
  WORKER: false,
  WORKER_INIT: false,
  WORKER_EMBED: false,
}

if (process.env.KERNEL_CONFIG) {
  Object.assign(config, require(process.env.KERNEL_CONFIG))
} else {
  Object.assign(config, require('./kernel.conf.js'))
}

const values = Object.keys(config).reduce((prev, cur) => {
  prev['%KERNEL_CONFIG_' + cur + '%'] = JSON.stringify(config[cur])
  return prev
}, {})

export default {
  entry: 'src/boot.js',
  format: 'iife',
  dest: 'dist-kernel.js',
  plugins: [
    json(),
    replace({ values: values }),
    builtins(),
    resolve({ jsnext: true }),
    babel({
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
        require("babel-plugin-transform-exponentiation-operator"),
        require("babel-plugin-transform-export-extensions"),
        require("babel-plugin-transform-function-bind"),
        require("babel-plugin-transform-object-rest-spread"),
        require("babel-plugin-external-helpers-2"),
      ]
    }),
    commonjs(),
  ]
}
