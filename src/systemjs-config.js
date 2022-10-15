/* Shared SystemJS Config */

// setup var recorder object

window._recorder_ = {_module_:{}}

// window._recorder_ = new Proxy({}, {
//   set: function(obj, prop, value) {
//     debugger
//     console.log("RECORDER set " + prop)
//     obj[prop] = value
//     return true
//   },  
  
//   get: function(obj, prop) {
//     return obj[prop]
//   }
// });

const moduleOptionsNon = {
  babelOptions: {
    es2015: false,
    stage2: false,
    stage3: false,
    plugins: []
  }
};

System.trace = true; // does not work in config

// config for loading babel plugins
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
    '*.js': moduleOptionsNon,
  },
  map: {
    // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
    'plugin-babel': lively4url + '/src/external/babel/plugin-babel6.js',
    'systemjs-plugin-babel': lively4url + '/src/external/babel/plugin-babel.js', // seems not to be loaded
    'systemjs-babel-build': lively4url + '/src/external/babel/systemjs-babel-browser.js',

    // aexpr support
    'active-expression': lively4url + '/src/client/reactive/active-expression/active-expression.js',
    'active-expression-rewriting': lively4url + '/src/client/reactive/active-expression-rewriting/active-expression-rewriting.js',
    'active-expression-proxies': lively4url + '/src/client/reactive/active-expression-proxies/active-expression-proxies.js',
    'babel-plugin-active-expression-rewriting': lively4url + '/src/client/reactive/babel-plugin-active-expression-rewriting/index.js',
    'babel-plugin-ILA': lively4url + '/src/client/reactive/babel-plugin-ILA/index.js',
    'babel-plugin-databindings': lively4url + '/src/client/reactive/babel-plugin-databindings/index.js',
    'babel-plugin-databindings-post-process': lively4url + '/src/client/reactive/babel-plugin-databindings/post-process.js',
    'babel-plugin-active-expression-proxies': lively4url + '/src/client/reactive/babel-plugin-active-expression-proxies/index.js',
    'active-expression-frame-based': lively4url + '/src/client/reactive/active-expression-convention/active-expression-frame-based.js',
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
    'babel-plugin-transform-do-expressions': lively4url + '/src/external/babel-plugin-transform-do-expressions.js',
    'babel-plugin-transform-function-bind': lively4url + '/src/external/babel-plugin-transform-function-bind.js',
    'babel-plugin-syntax-do-expressions': lively4url + '/src/external/babel-plugin-syntax-do-expressions.js',
    'babel-plugin-syntax-function-bind': lively4url + '/src/external/babel-plugin-syntax-function-bind.js',
    'babel-plugin-syntax-async-generators': lively4url + '/src/external/babel-plugin-syntax-async-generators.js',
    'babel-plugin-syntax-object-rest-spread': lively4url + '/src/external/babel-plugin-syntax-object-rest-spread.js',
    'babel-plugin-syntax-class-properties': lively4url + '/src/external/babel-plugin-syntax-class-properties.js',
    
    // support for doits
    'babel-plugin-doit-result': lively4url + '/src/external/babel-plugin-doit-result.js',
    'babel-plugin-doit-this-ref': lively4url + '/src/external/babel-plugin-doit-this-ref.js',
    'babel-plugin-doit-async': lively4url + '/src/external/babel-plugin-doit-async.js',
    'babel-plugin-locals': lively4url + '/src/external/babel-plugin-locals.js',
    'babel-plugin-var-recorder': lively4url + '/src/external/babel-plugin-var-recorder.js',
    'babel-plugin-var-recorder-dev': lively4url + '/src/external/babel-plugin-var-recorder-dev.js',
    'workspace-loader': lively4url + '/src/client/workspace-loader.js',

    // support for polymorphic identifiers
    'babel-plugin-polymorphic-identifiers': lively4url + '/src/client/reactive/babel-plugin-polymorphic-identifiers/babel-plugin-polymorphic-identifiers.js',
    'polymorphic-identifiers': lively4url + '/src/client/reactive/polymorphic-identifiers/polymorphic-identifiers.js',
    'babel-plugin-constraint-connectors': lively4url + '/src/client/reactive/babel-plugin-constraint-connectors/babel-plugin-constraint-connectors.js',
    'babel-plugin-constraint-connectors-active-expression': lively4url + '/src/client/reactive/babel-plugin-constraint-connectors-active-expression/babel-plugin-constraint-connectors-active-expression.js',

    // utils
    'lang': lively4url + '/src/client/lang/lang.js',
    'lang-ext': lively4url + '/src/client/lang/lang-ext.js',
    'lang-zone': lively4url + '/src/client/lang/lang-zone.js',

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
      ['babel-plugin-rp19-jsx', {
        executedIn: 'file'
      }],
      ['babel-plugin-jsx-lively', {
        executedIn: 'file'
      }],
      'babel-plugin-transform-do-expressions',
      'babel-plugin-transform-function-bind',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-syntax-object-rest-spread',
      'babel-plugin-syntax-class-properties',
      'babel-plugin-locals', // #TODO: remove this plugin from here
      'babel-plugin-var-recorder'
    ]
  }
};


const babel7base = {
  babelOptions: {
    babel7: true,
    plugins: [
      // ['babel-plugin-rp19-jsx', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-jsx-lively', {
      //   executedIn: 'file'
      // }],
      // 'babel-plugin-transform-do-expressions',
      // 'babel-plugin-transform-function-bind',
      // 'babel-plugin-syntax-async-generators',
      // 'babel-plugin-syntax-object-rest-spread',
      // 'babel-plugin-syntax-class-properties',
      // 'babel-plugin-locals', // #TODO: remove this plugin from here
      // 'babel-plugin-var-recorder'
    ]
  }
};



const aexprViaDirective = {
  babelOptions: {
    es2015: false,
    stage2: false,
    stage3: false,
    plugins: [
      'babel-plugin-constraint-connectors-active-expression',
      'babel-plugin-constraint-connectors',
      'babel-plugin-polymorphic-identifiers',
      ['babel-plugin-rp19-jsx', {
        executedIn: 'file'
      }],
      ['babel-plugin-jsx-lively', {
        executedIn: 'file'
      }],
      'babel-plugin-transform-do-expressions',
      'babel-plugin-transform-function-bind',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-syntax-object-rest-spread',
      'babel-plugin-syntax-class-properties',
      'babel-plugin-var-recorder',
      ['babel-plugin-ILA', {
        executedIn: 'file'
      }],
      ['babel-plugin-databindings', {
        executedIn: 'file'
      }],
      
      ['babel-plugin-active-expression-rewriting', {
        enableViaDirective: true,
        executedIn: 'file'
      }],
      ['babel-plugin-databindings-post-process', {
        executedIn: 'file'
      }],      
      ['babel-plugin-active-expression-proxies', {
        executedIn: 'file'
      }]
    ]
  },
  format: 'esm'
};

SystemJS.config({
  meta: {
    '*.js': liveES7,    
    '*.mjs': liveES7,
    [lively4url + "/src/external/*.js"]: liveES7,
    /* FILE-BASED */
    /* plugins are not transpiled with other plugins, except for SystemJS-internal plugins */
    [lively4url + '/src/external/babel-plugin-*.js']: moduleOptionsNon,
    [lively4url + '/src/client/ContextJS/src/*.js']: moduleOptionsNon,
    [lively4url + '/src/client/preferences.js']: moduleOptionsNon,

    [lively4url + '/src/external/eslint/*.js']: moduleOptionsNon, 
    
    
    [lively4url + '/demos/babel7/*.js']: babel7base,
    [lively4url + '/demos/*.js']: aexprViaDirective,
    [lively4url + '/templates/*.js']: aexprViaDirective,
    [lively4url + '/test/*.js']: liveES7,
    /* some tests with aexpr */
    [lively4url + '/test/bindings-test.js']: aexprViaDirective,
    
    // [lively4url + '/*.js']: aexprViaDirective,
    /* default for all .js files (not just lively4) */
    [lively4url + "/src/client/*.js"]: aexprViaDirective,
    [lively4url + "/src/components/*.js"]: aexprViaDirective,

    /* base extensions */
    [lively4url + "/src/client/lang/lang.js"]: moduleOptionsNon,
    [lively4url + "/src/client/lang/lang-ext.js"]: aexprViaDirective,
    
    /* blacklist all projects included for active expressions */
    [lively4url + "/src/client/reactive/*.js"]: liveES7,
    [lively4url + "/src/client/reactive/reactive-jsx/*.js"]: moduleOptionsNon,
    [lively4url + "/src/client/reactive/rp19-jsx/*.js"]: moduleOptionsNon,
    [lively4url + '/src/client/reactive/misc/*.js']: aexprViaDirective,
    [lively4url + '/src/client/reactive/components/basic/*.js']: liveES7,
    [lively4url + '/src/client/reactive/components/rewritten/*.js']: aexprViaDirective,
    /* ... except for the tests */
    [lively4url + '/src/client/reactive/test/*.js']: aexprViaDirective,
    
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
          lively4url + '/demos/swe/debugging-plugin.js',
          ['babel-plugin-constraint-connectors-active-expression', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-constraint-connectors', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-polymorphic-identifiers', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-rp19-jsx', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-jsx-lively', {
            executedIn: 'workspace'
          }],
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-syntax-object-rest-spread',
          'babel-plugin-syntax-class-properties',
          'babel-plugin-locals',
          'babel-plugin-doit-result',
          'babel-plugin-doit-this-ref',
          'babel-plugin-var-recorder',
          ['babel-plugin-ILA', {
            executedIn: 'file'
          }],
          ['babel-plugin-databindings', {
            executedIn: 'file'
          }],
          ['babel-plugin-active-expression-rewriting', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-databindings-post-process', {
            executedIn: 'file'
          }],
          ['babel-plugin-active-expression-proxies', {
            executedIn: 'workspace'
          }]
        ]
      },
      loader: 'workspace-loader'
    },
    'workspacejs:*': {
      babelOptions: {
        livelyworkspace: true,
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: [
          ['babel-plugin-constraint-connectors-active-expression', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-constraint-connectors', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-polymorphic-identifiers', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-rp19-jsx', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-jsx-lively', {
            executedIn: 'workspace'
          }],
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-syntax-object-rest-spread',
          'babel-plugin-syntax-class-properties',
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
        babel7: true, // #TODO for dev
        livelyworkspace: true,
        
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: [
          ['babel-plugin-constraint-connectors-active-expression', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-constraint-connectors', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-polymorphic-identifiers', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-rp19-jsx', {
            executedIn: 'workspace'
          }],
          ['babel-plugin-jsx-lively', {
            executedIn: 'workspace'
          }],
          'babel-plugin-transform-do-expressions',
          'babel-plugin-transform-function-bind',
          'babel-plugin-syntax-async-generators',
          'babel-plugin-syntax-object-rest-spread',
          'babel-plugin-syntax-class-properties',
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