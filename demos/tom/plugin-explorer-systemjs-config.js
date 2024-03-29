/*
 *
 * This file is meant to be importet in the plugin explorer worker via importScript
 *
 */

const pluginTransformationPlugin = lively4url + '/demos/tom/babel-plugin-tracer.js';

/*MD 

#TODO use normal system.js... there is no reason why not!

MD*/


function makeOptionsObject(plugins, babel7Level) {
  return {
    babelOptions: {
      babel7: true,
      babel7level: babel7Level,
      babel7plugins: plugins
    }
  }
}

const moduleOptionsNon = makeOptionsObject([], "moduleOptionsNon");
const pluginOptions = makeOptionsObject([pluginTransformationPlugin], "pluginExplorer")

System.config({
  baseURL: lively4url + '/',
  map: {
    // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
    'plugin-babel': lively4url + '/src/plugin-babel.js',
    'systemjs-plugin-babel': lively4url + '/src/plugin-babel.js', // seems not to be loaded
    // aexpr support
    'active-expression': lively4url + '/src/client/reactive/active-expression/active-expression.js',
    'active-expression-rewriting': lively4url +
      '/src/client/reactive/active-expression-rewriting/active-expression-rewriting.js',
    'active-expression-proxies': lively4url +
      '/src/client/reactive/active-expression-proxies/active-expression-proxies.js',
    'babel-plugin-active-expression-rewriting': lively4url +
      '/src/client/reactive/babel-plugin-active-expression-rewriting/index.js',
    'babel-plugin-databindings': lively4url + '/src/client/reactive/babel-plugin-databindings/index.js',
    'babel-plugin-active-expression-proxies': lively4url +
      '/src/client/reactive/babel-plugin-active-expression-proxies/index.js',
    'active-expression-frame-based': lively4url +
      '/src/client/reactive/active-expression-convention/active-expression-frame-based.js',
    'active-group': lively4url + '/src/client/reactive/active-group/select.js',

    // jsx support
    'babel-plugin-syntax-jsx': lively4url + '/src/external/babel-plugin-syntax-jsx.js',
    'babel-plugin-jsx-lively': lively4url + '/src/client/reactive/reactive-jsx/babel-plugin-jsx-lively.js',
    'babel-plugin-rp-jsx': lively4url + '/src/client/reactive/rp-jsx/babel-plugin-rp-jsx.js',
    'reactive-jsx': lively4url + '/src/client/reactive/reactive-jsx/reactive-jsx.js',
    'babel-plugin-rp19-jsx': lively4url + '/src/client/reactive/rp19-jsx/babel-plugin-rp19-jsx.js',
    'rp19-jsx': lively4url + '/src/client/reactive/rp19-jsx/rp19-jsx.js',

    // estree support
    'babel-plugin-estree': lively4url + '/src/external/babel-plugin-estree.js',

    // stage 0 support
    'babel-plugin-transform-do-expressions': lively4url +
      '/src/external/babel-plugin-transform-do-expressions.js',
    'babel-plugin-transform-function-bind': lively4url +
      '/src/external/babel-plugin-transform-function-bind.js',
    'babel-plugin-syntax-do-expressions': lively4url +
      '/src/external/babel-plugin-syntax-do-expressions.js',
    'babel-plugin-syntax-function-bind': lively4url + '/src/external/babel-plugin-syntax-function-bind.js',
    'babel-plugin-syntax-async-generators': lively4url +
      '/src/external/babel-plugin-syntax-async-generators.js',
    'babel-plugin-syntax-object-rest-spread': lively4url +
      '/src/external/babel-plugin-syntax-object-rest-spread.js',

    // utils
    'lang': lively4url + '/src/client/lang/lang.js',
    'lang-ext': lively4url + '/src/client/lang/lang-ext.js',

    // utils
    'utils': lively4url + '/src/client/utils.js'
  },
  transpiler: 'plugin-babel',
  meta: {}
});
