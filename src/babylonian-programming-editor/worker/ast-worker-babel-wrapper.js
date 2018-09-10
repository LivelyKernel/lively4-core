// Make a window object
self.window = self;
const lively4url = self.location.origin + self.location.pathname.split("/").slice(0,3).join("/");

// Load SystemJS
importScripts("../../external/systemjs/system.src.js")

// Configure SystemJS the same way as in the normal environment
const moduleOptionsNon = {
  babelOptions: {
    es2015: false,
    stage2: false,
    stage3: false,
    plugins: []
  }
};

System.trace = true; // does not work in config

// config for loading babal plugins
SystemJS.config({
  baseURL: lively4url + '/', // needed for global refs like "src/client/lively.js", we have to refactor those before disabling this here. #TODO #Discussion
  babelOptions: {
    // stage2: false,
    // stage3: false,
    // es2015: false,
    // stage0: true,
    // stage1: true
    //presets: [
    //    ["es2015", { "loose": true, "modules": false }]
    //],
    plugins: []
  },
  meta: {
    '*.js': moduleOptionsNon
  },
  map: {
    // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
    'plugin-babel': lively4url + '/src/external/babel/plugin-babel2.js',
    'systemjs-plugin-babel': lively4url + '/src/external/babel/plugin-babel.js', // seems not to be loaded
    'systemjs-babel-build': lively4url + '/src/external/babel/systemjs-babel-browser.js',

    // aexpr support
    'active-expressions': lively4url + '/src/client/reactive/active-expression/active-expression.js',
    'active-expression-rewriting': lively4url + '/src/client/reactive/active-expression-rewriting/active-expression-rewriting.js',
    'babel-plugin-active-expression-rewriting': lively4url + '/src/client/reactive/babel-plugin-active-expression-rewriting/index.js',
    'ui-aexpr': lively4url + '/src/client/reactive/active-expressions/ui-aexpr.js',
    // 'babel-plugin-locals': lively4url + '/src/client/reactive/active-expressions/babel-plugin-locals/index.js',
    'stack-es2015-modules': lively4url + '/src/client/reactive/active-expressions/stack-es2015-module/src/stack.js',
    'frame-based-aexpr': lively4url + '/src/client/reactive/active-expressions/frame-based-aexpr.js',
    // #TODO: duplicated, remove roq in imports
    'roq': lively4url + '/src/client/reactive/active-group/src/select.js',
    'active-groups': lively4url + '/src/client/reactive/active-group/src/select.js',

    // jsx support
    'babel-plugin-syntax-jsx': lively4url + '/src/external/babel-plugin-syntax-jsx.js',
    'babel-plugin-jsx-lively': lively4url + '/src/external/babel-plugin-jsx-lively.js',
    'reactive-jsx': lively4url + '/src/client/reactive/reactive-jsx/reactive-jsx.js',

    // stage 0 support
    'babel-plugin-transform-do-expressions': lively4url + '/src/external/babel-plugin-transform-do-expressions.js',
    'babel-plugin-transform-function-bind': lively4url + '/src/external/babel-plugin-transform-function-bind.js',
    'babel-plugin-syntax-do-expressions': lively4url + '/src/external/babel-plugin-syntax-do-expressions.js',
    'babel-plugin-syntax-function-bind': lively4url + '/src/external/babel-plugin-syntax-function-bind.js',
    'babel-plugin-syntax-async-generators': lively4url + '/src/external/babel-plugin-syntax-async-generators.js',

    // support for doits
    'babel-plugin-doit-result': lively4url + '/src/external/babel-plugin-doit-result.js',
    'babel-plugin-doit-this-ref': lively4url + '/src/external/babel-plugin-doit-this-ref.js',
    'babel-plugin-doit-async': lively4url + '/src/external/babel-plugin-doit-async.js',
    'babel-plugin-locals': lively4url + '/src/external/babel-plugin-locals.js',
    'babel-plugin-var-recorder': lively4url + '/src/external/babel-plugin-var-recorder.js',
    'workspace-loader': lively4url + '/src/client/workspace-loader.js',

    // utils
    'utils': lively4url + '/src/client/utils.js'
  },
  trace: true,
  transpiler: 'plugin-babel'
})

// await System.import('babel-plugin-doit-result');
// await System.import('babel-plugin-doit-this-ref');
// await System.import('babel-plugin-locals');
// await System.import('babel-plugin-var-recorder');
// await System.import(lively4url + '/src/client/workspaces.js');
// await System.import('workspace-loader');

const liveES7 = {
  babelOptions: {
    es2015: false,
    stage2: false,
    stage3: false,
    plugins: [
      'babel-plugin-jsx-lively',
      'babel-plugin-transform-do-expressions',
      'babel-plugin-transform-function-bind',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-locals', // #TODO: remove this plugin from here
      'babel-plugin-var-recorder'
    ]
  }
};

const aexprViaDirective = {
  babelOptions: {
    es2015: false,
    stage2: false,
    stage3: false,
    plugins: [
      'babel-plugin-jsx-lively',
      'babel-plugin-transform-do-expressions',
      'babel-plugin-transform-function-bind',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-var-recorder',
      ['babel-plugin-active-expression-rewriting', {
        enableViaDirective: true
      }]
    ]
  },
  format: 'esm'
};

SystemJS.config({
  meta: {
    '*.js': liveES7,
    [lively4url + "/src/external/*.js"]: liveES7,
    /* FILE-BASED */
    // plugins are not transpiled with other plugins, except for SystemJS-internal plugins
    [lively4url + '/src/external/babel-plugin-*.js']: moduleOptionsNon,
    [lively4url + '/src/client/ContextJS/src/*.js']: moduleOptionsNon,
    // blacklist all projects included for active expressions
    [lively4url + '/src/client/reactive/*.js']: moduleOptionsNon,
    [lively4url + '/src/external/aexpr/*.js']: moduleOptionsNon,
    // ... except for the tests
    // [lively4url + '/src/external/aexpr/test/*.spec.js']: aexprViaDirective,
    // [lively4url + '/src/external/roq/test/*.js']: aexprViaDirective,

    [lively4url + '/demos/*.js']: aexprViaDirective,
    [lively4url + '/templates/*.js']: aexprViaDirective,
    [lively4url + '/test/*.js']: liveES7,
    // [lively4url + '/*.js']: aexprViaDirective,
    // default for all .js files (not just lively4)
    [lively4url + "/src/client/*.js"]: aexprViaDirective,
    [lively4url + "/src/components/*.js"]: aexprViaDirective,

    // blacklist all projects included for active expressions
    [lively4url + "/src/client/reactive/*.js"]: moduleOptionsNon,
    [lively4url + "/src/client/reactive/reactive-jsx/*.js"]: liveES7,
    [lively4url + "/src/client/reactive/tern-spike/*.js"]: aexprViaDirective,
    // ... except for the tests
    [lively4url + '/src/client/reactive/active-expressions/test/*.spec.js']: aexprViaDirective,
    [lively4url + '/src/client/reactive/active-expressions/stack-es2015-module/test/*.spec.js']: aexprViaDirective,
    [lively4url + '/src/client/reactive/active-group/test/*.js']: aexprViaDirective,
    // [lively4url + '/demos/*.js']: liveES7,
    // [lively4url + '/doc/*.js']: liveES7,
    // [lively4url + '/media/*.js']: liveES7,
    // [lively4url + '/node_modules/*.js']: liveES7,
    // [lively4url + '/src/client/*.js']: liveES7,
    // [lively4url + '/src/external/*.js']: liveES7,
    // [lively4url + '/src/*.js']: liveES7,
    /* WORKSPACE */
    'workspace:*': {
      babelOptions: {
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: [
          'babel-plugin-jsx-lively',
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-locals',
          'babel-plugin-doit-result',
          'babel-plugin-doit-this-ref',
          'babel-plugin-var-recorder',
          'babel-plugin-active-expression-rewriting'
        ]
      },
      loader: 'workspace-loader'
    },
    'workspacejs:*': {
      babelOptions: {
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: [
          'babel-plugin-jsx-lively',
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-locals',
          'babel-plugin-doit-result',
          'babel-plugin-doit-this-ref',
          'babel-plugin-var-recorder'
        ]
      },
      loader: 'workspace-loader'
    },
    'workspaceasyncjs:*': {
      babelOptions: {
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: [
          'babel-plugin-jsx-lively',
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-locals',
          'babel-plugin-doit-result',
          'babel-plugin-doit-this-ref',
          'babel-plugin-var-recorder',
          'babel-plugin-doit-async',
        ]
      },
      loader: 'workspace-loader'
    },
  }
});

// React to messages
onmessage = function(e) {
  System.import("src/babylonian-programming-editor/worker/ast-worker.js")
    .then((m) => {
      m.default(e);
    })
    .catch((error) => {
      postMessage(error);
    });
};
