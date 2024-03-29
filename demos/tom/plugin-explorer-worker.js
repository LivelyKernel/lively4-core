// first lines copied from src/worker/babelPluginSyntaxJSX
self.window = self;

// as lively4url would not be defined otherwise we need to compute it here
const myPath = '/demos/tom/plugin-explorer-worker.js';
self.lively4url = self.location.toString().replace(myPath, "");

/* globals importScripts pluginOptions moduleOptionsNon pluginTransformationPlugin */

importScripts(lively4url + '/src/external/systemjs/system.src.js');
importScripts(lively4url + '/demos/tom/plugin-explorer-systemjs-config.js')

// not sure why I need this but without it I cannot import the plugins
System.import(pluginTransformationPlugin);

const enumerationPlugin = createTraceID => function() {
  const visitor = {
    enter(path) {
      if (!path.node.traceID) {
        path.node.traceID = createTraceID();
      }
    }
  };

  return {
    visitor: {
      Program(path) {
        path.node.traceID = createTraceID();
        path.traverse(visitor)
      }
    }
  }
}

const enumerationConfig = createTraceID => {
  return { 
    plugins: [enumerationPlugin(createTraceID)],
    comments: true,
    code: true,
    ast: true
  }
}

// copied from src/client/lively.js
async function unloadModule(path) {
  var normalizedPath = System.normalizeSync(path)
  try {
    // check, to prevent trying to reloading a module a second time if there was an error #375
    if (System.get(normalizedPath)) {
      await System.import(normalizedPath).then(module => {
        if (module && typeof module.__unload__ === "function") {
          module.__unload__();
        }
      });
    }
  } catch (e) {
    console.log("WARNING: error while trying to unload " + path)
  }
  System.registry.delete(normalizedPath);
  // #Hack #issue in SystemJS babel syntax errors do not clear errors
  System['@@registerRegistry'][normalizedPath] = undefined;
  delete System.loads[normalizedPath]
}

function decorateFunction(toBeDecorated, decorator) {
  return function() {
    const result = toBeDecorated(...arguments);
    decorator(result);
    return result;
  }
}

function decorateNodePathTraverse(plugin, trace) {
  return decorateFunction(plugin, result => {
    const oldPre = result.pre;
    result.pre = function(state) {
      if (!state.preIsAlreadyDecorated) {
        const oldTraverse = state.path.__proto__.traverse;
        state.path.__proto__.traverse = function(visitors, ...rest) {
          const newVisitors = {};
          for (const name in visitors) {
            if (typeof visitors[name] === 'function') {
              const fn = visitors[name];
              newVisitors[name] = function(path, ...rest) {
                trace.startTraversePlugin(name, path.node.traceID);
                fn(path, ...rest);
                trace.endTraversePlugin(name);
              };
            } else if (typeof visitors[name] === 'object') {
              const obj = visitors[name];

              // Todo: what is if already decorated
              if (obj.enter) {
                obj.enter = obj.enter.map(fn => function(path, ...rest) {
                  trace.startTraversePlugin(name, path.node.traceID);
                  fn(path, ...rest);
                  trace.endTraversePlugin(name);
                })
              }

              if (obj.exit) {
                obj.exit = obj.exit.map(fn => function(path, ...rest) {
                  trace.startTraversePlugin(name, path.node.traceID);
                  fn(path, ...rest);
                  trace.endTraversePlugin(name);
                })
              }
              newVisitors[name] = obj;
            }
          }
          oldTraverse.call(this, newVisitors, ...rest);
        }
        state.preIsAlreadyDecorated = true;
      }

      if (oldPre) {
        oldPre(...arguments);
      }

    }
  });
}


async function importPlugin(url) {
  const module = await System.import(url);
  const plugin = module.default;

  let modifiedPlugin = decorateFunction(plugin, result => {
    result.name = result.name || 'Please name your plugin!';
  });

  modifiedPlugin

  return modifiedPlugin;
}

function importPlugins(pluginData) {
  return Promise.all(pluginData.map(({ url, data }) => importPlugin(url)))
    .then(plugins => {
      let counter = 0;
      for (const plugin of plugins) {
        if (plugin.name === 'Please name your plugin!') {
          plugin.name += counter;
          counter++;
        }
      }
      return plugins;
    })
}

const importPromise = Promise.all(['demos/tom/trace.js', 'src/external/babel/babel7default.js', 'demos/tom/wrapAST.js'].map(name =>
  System.import(name)));

self.onmessage = function(msg) {
  importPromise.then(function(imports) {
    const Trace = imports[0].default;
    const babel = imports[1].default.babel;
    const wrapAST = imports[2].default;

    const config = {
      filename: 'tmpfile.js',
      moduleIds: false,
      babelrc: false,
    };
    // After loading SystemJS and the base modules... everything goes throw the tracer?
    System.config({
      meta: {
        '*.js': pluginOptions,
        [pluginTransformationPlugin]: moduleOptionsNon
      }
    });

    // const preloadedPlugins = new Set(Object.keys(System['@@registerRegistry']));


    const trace = new Trace();
    // make it globally available for use in plugins
    window[Trace.traceIdentifierName] = trace;

    function createTraceID() {
      return trace.createTraceID();
    }

    importPlugins(msg.data.pluginData)
      .then(function(modules) {
        config.plugins = modules;
        config.sourceFileName = 'tmpfile.js';
        config.sourceMaps = true;

        config.wrapPluginVisitorMethod = (pluginAlias, visitorType, callback) => {
          return (path, ...rest) => {
            trace.enterPlugin(pluginAlias, path.node.traceID);
            callback(path, ...rest);
            trace.leavePlugin(pluginAlias);
          }
        };

        config.plugins = config.plugins.map(plugin => decorateNodePathTraverse(plugin, trace));
        trace.startTraversion();
        debugger
        const ast = babel.transform(msg.data.source, enumerationConfig(createTraceID)).ast;
        
      
        const oldASTAsString = JSON.stringify(ast);

      
        wrapAST(ast, trace);
        try {
          // data is gathered through instrumentation
          babel.transformFromAst(ast, undefined, config);
        } catch (e) {
          trace.error(e);
        }

        postMessage({
          // #TODO locations missing
          oldAST: oldASTAsString,
          trace: trace.serialize()
        });

        /* Todo: find the correct files to unload. SystemJS imports plugins + their imports.
        I could not get them to be unloaded correctly, but they needed to be loaded again in
        the next use of the worker.
                
        const pluginsToUnload = Object.keys(System['@@registerRegistry']).filter(plugin => !
            preloadedPlugins.has(plugin));

        Promise.all(pluginsToUnload.map(unloadModule))
            .then(_ => {
                
            })*/
      })
  })
}
