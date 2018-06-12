/**
 * boot.js -- loads lively in any page that inserts through a script tag
 *
 **/

/* global lively4performance */
/* eslint no-console: off */

/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */

import * as cop  from './ContextJS/src/contextjs.js';

console.log(cop)
debugger

window.lively4plugincache = window.localStorage["livel4systemjscache"] == "true";

async function invalidateFileCaches()  {
  try {
    if (!window.caches) {
      console.warn("window.caches not defined")
      return
    }
    var offlineFirstCache = await caches.open("offlineFirstCache")
    var url = lively4url + "/"
    var json = await Promise.race([
      new Promise(r => {
        setTimeout(() => r(false), 5000) // give the server 5secs ... might be an old one or somthing, anyway keep going!
      })
      ,fetch(url, {
        method: "OPTIONS",
        headers: {
          filelist  : true
        }
      }).then(async resp => {
        if (resp.status != 200) {
          console.log("PROBLEM invalidateFileCaches " + resp.status)
          return false
        } else {
          try {
            var text = await resp.text()
            return JSON.parse(text)
          } catch(e) {
            console.log("could not parse: " + text)
            return undefined
          }
        }
      })
    ])
  } catch(e) {
    console.log("PROBLEM invalidateFileCaches " + e)
    return
  }

  if (!json) {
    console.log('[boot] invalidateFileCaches: could not invalidate flash... should we clean it all?')
    return
  }
  var list = json.contents

  for(let ea of list) {
    if (!ea.name) continue;
    var fileURL = url + ea.name.replace(/^.\//,"")
    var cached  = await offlineFirstCache.match(fileURL)

    if (cached) {
      var cachedModified = cached.headers.get("modified")
      if (ea.modified > cachedModified) {
        console.log("invalidate cache " + fileURL + `${ea.modified} > ${cachedModified}`)
        offlineFirstCache.delete(fileURL) // we could start loading it again?
      } else {
        // console.log("keep " + ea.modified)
      }
    }
  }
}

window.lively4invalidateFileCaches = invalidateFileCaches


if (window.lively && window.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
  (function() {
    // early feedback due to long loading time
    let livelyBooting = document.createElement('div');
    Object.assign(livelyBooting.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

      zIndex: '10000',

      backgroundColor: 'white',
      border: 'black 1px solid',
      padding: '5px',
      boxShadow: '0px 0px 3px 0px rgba(40, 40, 40,0.66)'
    });
    livelyBooting.innerHTML = `<img alt="Lively 4" style="display:block; margin:auto;" src="media/lively4_logo_smooth_100.png" />
<span style="font-size: large;font-family:arial">Booting:</span>
<div style="font-family:arial" id="lively-booting-message"></div>`;
    document.body.appendChild(livelyBooting);

    function groupedMessage(part, numberOfSteps, message) {
      console.group(`${part}/${numberOfSteps}: ${message}.`);

      let messageDiv = document.body.querySelector('#lively-booting-message');
      if(messageDiv) {
        messageDiv.innerHTML = `<span>${part}</span>/<span>${numberOfSteps}</span>: <span>${message}.</span>`;
      }
    }

    function groupedMessageEnd() {
      console.groupEnd();
    }

    console.group("BOOT");

    // for finding the baseURL...
    
    // var script = document.currentScript;
    // var scriptURL = script.src;

    // window.lively4url = scriptURL.replace("/src/client/boot.js","");
    window.lively4url = window.location.toString().replace(/\/start2.html.*/, '')
    
    // some performance logging
    window.lively4performance = {start: performance.now()}
    try {
      Object.defineProperty(window, 'lively4stamp', {
        get: function() {
          if (!window.lively4performance) return;
          var newLast = performance.now()
          var t = (newLast - (lively4performance.last || lively4performance.start)) / 1000
          lively4performance.last = newLast
          return (t.toFixed(3) + "s ")
        }
      })
    } catch(e) {
      console.error(e)
    }

    var loadContainer = true; //script.getAttribute("data-container"); // some simple configuration

    console.log("lively4url: " + lively4url);

    // BEGIN COPIED HERE BECAUSE resuse through libs does not work yet
    var loadJavaScriptThroughDOM = function(name, src, force) {
      return new Promise(function (resolve) {
        var scriptNode = document.querySelector(name);
        if (scriptNode) {
          scriptNode.remove();
        }
        var script = document.createElement("script");
        script.id = name;
        script.charset = "utf-8";
        script.type = "text/javascript";
        script.setAttribute("data-lively4-donotpersist","all");
        if (force) {
          src += +"?" + Date.now();
        }
        script.src = src;
        script.onload = function () {
          resolve();
        };
        document.head.appendChild(script);
      });
    }
    // END COPIED

    groupedMessage(1, 4, 'Setup SystemJS');
    Promise.resolve().then(() => {
      return loadJavaScriptThroughDOM("systemjs", lively4url + "/src/external/systemjs/system.src.js");
    }).then(async () => {
      // setup var recorder object
      window._recorder_ = {_module_:{}}

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
          'active-expressions': lively4url + '/src/client/reactive/active-expressions/active-expressions/src/active-expressions.js',
          'aexpr-source-transformation-propagation': lively4url + '/src/client/reactive/active-expressions/aexpr-source-transformation-propagation/src/aexpr-source-transformation-propagation.js',
          'babel-plugin-aexpr-source-transformation': lively4url + '/src/client/reactive/active-expressions/babel-plugin-aexpr-source-transformation/index.js',
          'aexpr-ticking': lively4url + '/src/client/reactive/active-expressions/aexpr-ticking/src/aexpr-ticking.js',
          'ui-aexpr': lively4url + '/src/client/reactive/active-expressions/ui-aexpr.js',
          // 'babel-plugin-locals': lively4url + '/src/client/reactive/active-expressions/babel-plugin-locals/index.js',
          'stack-es2015-modules': lively4url + '/src/client/reactive/active-expressions/stack-es2015-module/src/stack.js',
          'frame-based-aexpr': lively4url + '/src/client/reactive/active-expressions/frame-based-aexpr.js',
          // #TODO: duplicated, remove roq in imports
          'roq': lively4url + '/src/client/reactive/active-groups/src/select.js',
          'active-groups': lively4url + '/src/client/reactive/active-groups/src/select.js',

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
            ['babel-plugin-aexpr-source-transformation', {
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
          [lively4url + '/src/client/reactive/active-groups/test/*.js']: aexprViaDirective,
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
                'babel-plugin-aexpr-source-transformation'
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

      groupedMessageEnd();
      try {
        var livelyloaded = new Promise(async livelyloadedResolve => {

          groupedMessage(1, 4, 'Invalidate Caches');
          await invalidateFileCaches()
          groupedMessageEnd();

          groupedMessage(2, 4, 'Wait for Service Worker');
          
          const { whenLoaded } = await System.import(lively4url + "/src/client/load.js");
          await new Promise(whenLoaded);
          groupedMessageEnd();

          groupedMessage(3, 4, 'Look for uninitialized instances of Web Compoments');
          await lively.components.loadUnresolved();
          groupedMessageEnd();

          groupedMessage(4, 4, 'Initialize Document');
          await lively.initializeDocument(document, window.lively4chrome, loadContainer);
          groupedMessageEnd();

          console.log("Finally loaded!");

          document.dispatchEvent(new Event("livelyloaded"));

          livelyloadedResolve(true);
        })

        await livelyloaded
      } catch(err) {
        console.error("Lively Loading failed");
        console.error(err);
        alert("load Lively4 failed:" + err);
      } finally {
        console.groupEnd(); // BOOT
        livelyBooting.remove();
      }
    });
  })();
}
