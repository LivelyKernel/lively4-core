/**
 * boot.js -- loads lively in any page that inserts through a script tag
 *
 **/
 
/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */
 
if (window.lively && window.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
 
  console.group("BOOT")
  
  // for finding the baseURL...
  var script = document.currentScript
  var scriptURL = script.src;
  window.lively4url = scriptURL.replace("/src/client/boot.js","")
  
  var loadContainer = script.getAttribute("data-container") // some simple configuration 
  console.log("lively4url: " + lively4url);
  if (window.location.search.match(/[?&]nomain/)) {
    loadContainer = false
  }
  
   
  // COPIED HERE BECAUSE resuse through libs does not work yet
  function loadJavaScriptThroughDOM(name, src, force) {
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
  
  Promise.resolve().then( () => {
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
        'systemjs-plugin-babel': lively4url + '/src/external/babel/plugin-babel.js',
        'systemjs-babel-build': lively4url + '/src/external/babel/systemjs-babel-browser.js',
        'kernel': lively4url + '/src/client/legacy-kernel.js',

        // aexpr support
        'active-expressions': lively4url + '/src/external/aexpr/active-expressions/src/active-expressions.js',
        'aexpr-source-transformation-propagation': lively4url + '/src/external/aexpr/aexpr-source-transformation-propagation/src/aexpr-source-transformation-propagation.js',
        'babel-plugin-aexpr-source-transformation': lively4url + '/src/external/aexpr/babel-plugin-aexpr-source-transformation/index.js',
        'babel-plugin-locals': lively4url + '/src/external/aexpr/babel-plugin-locals/index.js',
        'stack-es2015-modules': lively4url + '/src/external/aexpr/stack-es2015-module/src/stack.js',

        // support for doits
        'babel-plugin-doit-result': lively4url + '/src/external/babel-plugin-doit-result.js',
        'babel-plugin-doit-this-ref': lively4url + '/src/external/babel-plugin-doit-this-ref.js',
        'babel-plugin-locals': lively4url + '/src/external/babel-plugin-locals.js',
        'babel-plugin-var-recorder': lively4url + '/src/external/babel-plugin-var-recorder.js',
        'workspace-loader': lively4url + '/src/client/workspace-loader.js'
      },
      trace: true,
      transpiler: 'plugin-babel'
    })
    
/*    await System.import('babel-plugin-doit-result');
    await System.import('babel-plugin-doit-this-ref');
    await System.import('babel-plugin-locals');
    await System.import('babel-plugin-var-recorder');
  */  //await System.import(lively4url + '/src/client/workspaces.js');
    //await System.import('workspace-loader');
    
    SystemJS.config({
      meta: {
        // plugins are not transpiled with other plugins, except for SystemJS-internal plugins
        [lively4url + '/src/external/babel-plugin-*.js']: moduleOptionsNon,
        [lively4url + '/src/external/ContextJS/src/*.js']: moduleOptionsNon,
        //['']: moduleOptionsNon,
        // blacklist all projects included for active expressions
        [lively4url + '/src/external/aexpr/*.js']: moduleOptionsNon,
        '*.js': {
          babelOptions: {
            es2015: false,
            stage2: false,
            stage3: false,
            plugins: window.__karma__ ? [] : [ // #TODO disable plugins while testing... for now
              'babel-plugin-locals',
              'babel-plugin-var-recorder'
            ]
          }
        },
        'workspace:*': {
          babelOptions: {
            es2015: false,
            stage2: false,
            stage3: false,
            plugins: [
              'babel-plugin-locals',
              'babel-plugin-doit-result',
              'babel-plugin-doit-this-ref',
              'babel-plugin-var-recorder',
              'babel-plugin-aexpr-source-transformation'
            ]
          },
          loader: 'workspace-loader'
        },
      }
    });

    try {
      let { whenLoaded } = await System.import(lively4url + "/src/client/load.js")
      
      console.group("1/3: Wait for Service Worker...")
      await new Promise(whenLoaded);
      console.groupEnd();
      
      console.group("2/3: Look for uninitialized instances of Web Compoments");
      await lively.components.loadUnresolved();
      console.groupEnd();
      
      console.group("3/3: Initialize Document")
      await lively.initializeDocument(document, window.lively4chrome, loadContainer);
      
      await lively.initializeLocalContent();
      console.groupEnd();
      
      console.log("Finally loaded!");
      
      document.dispatchEvent(new Event("livelyloaded"))
      
      console.groupEnd(); // BOOT
    } catch(err) {
      console.error("Lively Loading failed");
      console.error(err);
      alert("load Lively4 failed:" + err);
    }
  });
}
