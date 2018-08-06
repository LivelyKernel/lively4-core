var babel = require('systemjs-babel-build').babel;

// the SystemJS babel build includes standard presets
var es2015 = require('systemjs-babel-build').presetES2015;
var es2015Register = require('systemjs-babel-build').presetES2015Register;
var modulesRegister = require('systemjs-babel-build').modulesRegister;
var stage3 = require('systemjs-babel-build').pluginsStage3;
var stage2 = require('systemjs-babel-build').pluginsStage2;
var stage1 = require('systemjs-babel-build').pluginsStage1;

// Caching the transformation results seems to be problematic..
// storage 1: localStorage ... fast, but has storage limitations
// storage 2: indexdb 
var Dexie = require('../dexie.js').Dexie;
var pluginBabelCache = new Dexie("pluginBabelCache");
pluginBabelCache.version("1").stores({
    files: 'url, source, output, map'
}).upgrade(function () {
})
// storage 3: cache API... here we go
let transformCache

var useCacheAPI = true // #TODO refactor when we found a fast solution... 

// var diff = require('src/external/diff-match-patch.js').default;



// import {getScopeIdForModule} from "./../babel-plugin-var-recorder.js" 
function getScopeIdForModule(moduleName) {
  return moduleName.replace(/[^a-zA-Z0-9]/g,"_") 
}

var externalHelpers = require('systemjs-babel-build').externalHelpers;
var runtimeTransform = require('systemjs-babel-build').runtimeTransform;

var babelRuntimePath;
var modularHelpersPath = System.decanonicalize('./babel-helpers/', module.id);
var externalHelpersPath = System.decanonicalize('./babel-helpers.js', module.id);
var regeneratorRuntimePath = System.decanonicalize('./regenerator-runtime.js', module.id);

if (modularHelpersPath.substr(modularHelpersPath.length - 3, 3) == '.js')
  modularHelpersPath = modularHelpersPath.substr(0, modularHelpersPath.length - 3);

// in builds we want to embed canonical names to helpers
if (System.getCanonicalName) {
  modularHelpersPath = System.getCanonicalName(modularHelpersPath);
  externalHelpersPath = System.getCanonicalName(externalHelpersPath);
  regeneratorRuntimePath = System.getCanonicalName(regeneratorRuntimePath);
}


// disable SystemJS runtime detection
SystemJS._loader.loadedTranspilerRuntime = true;

function prepend(a, b) {
  for (var p in b)
    if (!(p in a))
      a[p] = b[p];
  return a;
}

/*
 * babelOptions:
 *   modularRuntime: true / false (whether to use babel-runtime or babel/external-helpers respectively)
 *   sourceMaps: true / false (defaults to true)
 *   es2015: true / false (defaults to true)
 *   stage3: true / false (defaults to true)
 *   stage2: true / false (defaults to true)
 *   stage1: true / false (defaults to false)
 *   plugins: array of custom plugins (objects or module name strings)
 *   presets: array of custom presets (objects or module name strings)
 *   compact: as in Babel
 *   comments: as in Babel
 *
 * babelOptions can be set at SystemJS.babelOptions OR on the metadata object for a given module
 */
var defaultBabelOptions = {
  modularRuntime: true,
  sourceMaps: true,
  es2015: true,
  stage3: true,
  stage2: true,
  stage1: false,
  compact: false,
  comments: true
};

exports.translate = async function(load, traceOpts) {
  // console.log("plugin-babel transform ", load)
  
  
  if (!transformCache && self.caches) transformCache = await caches.open("plugin-babel")
  
  // we don't transpile anything other than CommonJS or ESM
  if (load.metadata.format == 'global' || load.metadata.format == 'amd' || load.metadata.format == 'json')
    throw new TypeError('plugin-babel cannot transpile ' + load.metadata.format + ' modules. Ensure "' + load.name + '" is configured not to use this loader.');

  var loader = this;
  var pluginLoader = loader.pluginLoader || loader;

  // we only output ES modules when running in the builder
  var outputESM = traceOpts ? traceOpts.outputESM : loader.builder;

  var babelOptions = {};

  if (load.metadata.babelOptions)
    prepend(babelOptions, load.metadata.babelOptions);

  if (loader.babelOptions)
    prepend(babelOptions, loader.babelOptions);

  prepend(babelOptions, defaultBabelOptions);

  // determine any plugins or preset strings which need to be imported as modules
  var pluginAndPresetModuleLoads = [];

  if (babelOptions.presets)
    babelOptions.presets.forEach(function(preset) {
      if (typeof preset == 'string')
        pluginAndPresetModuleLoads.push(pluginLoader['import'](preset, module.id));
    });

  if (babelOptions.plugins)
    babelOptions.plugins.forEach(function(plugin) {
      plugin = typeof plugin == 'string' ? plugin : Array.isArray(plugin) && typeof plugin[0] == 'string' && plugin[0];
      if (!plugin)
        return;
      pluginAndPresetModuleLoads.push(
        pluginLoader.normalize(plugin, module.id)
        .then(function(normalized) {
          return pluginLoader.load(normalized)
          .then(function() {
            return pluginLoader.get(normalized)['default'];
          });
        })
      );
    });

  return Promise.all(pluginAndPresetModuleLoads)
  .then(async function(pluginAndPresetModules) {
    var curPluginOrPresetModule = 0;

    var presets = [];
    var plugins = [];

    if (babelOptions.modularRuntime) {
      if (load.metadata.format == 'cjs')
        throw new TypeError('plugin-babel does not support modular runtime for CJS module transpilations. Set babelOptions.modularRuntime: false if needed.');
      presets.push(runtimeTransform);
    }
    else {
      if (load.metadata.format == 'cjs')
        load.source = 'var babelHelpers = require("' + externalHelpersPath + '");' + load.source;
      else
        load.source = 'import babelHelpers from "' + externalHelpersPath + '";' + load.source;
      presets.push(externalHelpers);
    }

    if (babelOptions.es2015)
      presets.push((outputESM || load.metadata.format == 'cjs') ? es2015 : es2015Register);
    else if (!(outputESM || load.metadata.format == 'cjs'))
      presets.push(modulesRegister);

    if (babelOptions.stage3)
      presets.push({
        plugins: stage3
      });

    if (babelOptions.stage2)
      presets.push({
        plugins: stage2
      });

    if (babelOptions.stage1)
      presets.push({
        plugins: stage1
      });

    if (babelOptions.presets)
      babelOptions.presets.forEach(function(preset) {
        if (typeof preset == 'string')
          presets.push(pluginAndPresetModules[curPluginOrPresetModule++]);
        else
          presets.push(preset);
      });

    if (babelOptions.plugins)
      babelOptions.plugins.forEach(function(plugin) {
        if (typeof plugin == 'string')
          plugins.push(pluginAndPresetModules[curPluginOrPresetModule++]);
        else if (Array.isArray(plugin) && typeof plugin[0] == 'string')
          plugins.push([pluginAndPresetModules[curPluginOrPresetModule++], plugin[1]]);
        else
          plugins.push(plugin);
      });

    // console.log(`load: ${load.address}`, plugins);
    
    // #Experiment with caching.... 
    var startTransform = performance.now()
    let cachedInputCode, cachedOutputCode, cachedOutputMap
    if(self.lively4plugincache && transformCache) {
      var key = "pluginBabelTransfrom_" + load.name.replace(/[^A-Za-z0-9 _\-./]/g,"_")
      
       // console.log(`lively4plugincache `);
      
      // storage 1
      //       var cachedInputCode = self.localStorage && self.localStorage[key+"_source"]
      //       var cachedOutputCode = self.localStorage && self.localStorage[key]
      // cachedOutputMap = JSON.parse(self.localStorage[key+"_map"]
      
      if (!useCacheAPI) {
        // console.log(`storage 2`);
        // storage 2
        var loadCacheStart = performance.now()
        let cached = await pluginBabelCache.files.get(key)
        // console.log("cache loaded in " + (performance.now() -loadCacheStart ) + "ms")
            if (cached) {
          cachedInputCode = cached.source
          cachedOutputCode = cached.output 
          cachedOutputMap = JSON.parse(cached.map)           
        }
      } else {
        // console.log(`storage 3`);

        // storage 3
        try {
          var matchWorked 
          await Promise.race([
            new Promise(r => setTimeout(r, 1000)).then( () => {
              if (!matchWorked) {
                console.warn("TIMEOUT transform cache " + key, cachedOutputCode, cachedOutputMap, cachedOutputMap)  
                cachedOutputCode = null;
                cachedOutputMap = null;                
              }
            }),
            // Promise.all([
            //     transformCache.match(key + "_source").then(r => r && r.text()).then( t => cachedInputCode = t),
            //     transformCache.match(key + "_output").then(r => r && r.text()).then( t => cachedOutputCode = t),
            //     transformCache.match(key + "_map").then(r => r && r.text())
            //       .then( t => cachedOutputMap = t && JSON.parse(t))])          

            // There seems to be a hickup in the code above... lets wait more
            (async () => {
                await transformCache.match(key + "_source").then(r => r && r.text()).then( t => cachedInputCode = t)
                await transformCache.match(key + "_output").then(r => r && r.text()).then( t => cachedOutputCode = t)
                await transformCache.match(key + "_map").then(r => r && r.text())
                  .then( t => cachedOutputMap = t && JSON.parse(t))          
            // but it does not help, the #Bug seems to be in #
                matchWorked = true
                // console.log("loaded cached transform " + key)
            })()
            
          ])
          
        } catch(e) {
          console.error(`could not load from transform cache`);  
        }
        
        // console.log(`storage 3 finished`);
      }
      if (cachedOutputCode && (cachedInputCode == load.source)) {
        // console.log("plugin babel use cache: " + load.name)
        try {

          output = {
            code: cachedOutputCode,
            map: cachedOutputMap
          }      

          // side effects of using the transformation
          var moduleURL = SystemJS.normalizeSync(load.name)
          // a) var recorder
          _recorder_[getScopeIdForModule(moduleURL)] = {} // #Idea maybe this should go lazy into the module? @Stefan

        } catch(e) {
          console.warn("something went wrong... while loading cache " + e)
          output = undefined
        }
        cachedOutput = output
      } 

    } 
    // console.log(`cached output = `, output);
    
    if (!output) {
    
    var output = babel.transform(load.source, {
      babelrc: false,
      plugins: plugins,
      presets: presets,
      filename: load.address,
      sourceFileName: load.address,// + (load.address.match(/\?/) ? "&" : "?")+"forceLoad=" + Date.now(), // #Hack to make Chrome display the updated source code
      moduleIds: false,
      sourceMaps: traceOpts && traceOpts.sourceMaps || babelOptions.sourceMaps,
      inputSourceMap: load.metadata.sourceMap,
      compact: babelOptions.compact,
      comments: babelOptions.comments,
      code: true,
      ast: true,
      resolveModuleSource: function(m) {
        if (m.substr(0, 22) == 'babel-runtime/helpers/') {
          m = modularHelpersPath + m.substr(22) + '.js';
        }
        else if (m == 'babel-runtime/regenerator') {
          m = regeneratorRuntimePath;
        }
        else if (m.substr(0, 14) == 'babel-runtime/') {
          if (!babelRuntimePath) {
            babelRuntimePath = System.decanonicalize('babel-runtime/', module.id);
            if (babelRuntimePath.substr(babelRuntimePath.length - 3, 3) == '.js')
              babelRuntimePath = babelRuntimePath.substr(0, babelRuntimePath.length - 3);
            if (loader.getCanonicalName)
              babelRuntimePath = loader.getCanonicalName(babelRuntimePath);
            if (babelRuntimePath == 'babel-runtime/')
              throw new Error('The babel-runtime module must be mapped to support modular helpers and builtins. If using jspm run jspm install npm:babel-runtime.');
          }
          m = babelRuntimePath + m.substr(14) + '.js';
        }
        return m;
      }
    });
    
    // console.log("output ", output)
      
    if (self.lively4plugincache && transformCache) {

      // storage 1      
      // self.localStorage[key] = output.code
      // self.localStorage[key +"_source"] = load.source
      // self.localStorage[key +"_map"] = JSON.stringify(output.map)

      if (!useCacheAPI && transformCache) {
        pluginBabelCache.files.put({
          url: key,
          source: load.source,
          output: output.code,
          map: JSON.stringify(output.map)
        })        
      } else {
          transformCache.put(key + "_source", new Response(load.source))
          transformCache.put(key + "_output", new Response(output.code))
          transformCache.put(key + "_map", new Response(JSON.stringify(output.map)))
      }
      
    }
      
    if (!self.babelTransformTimer) self.babelTransformTimer = []
    self.babelTransformTimer.push({
      name: load.name,
      size: load.source.length,
      time: (performance.now() - startTransform)
    })
    
    if (cachedOutputCode) {
      // console.log("used cached output " + (performance.now() - startTransform) + "ms")
    } else {
      // console.log("transformed in " + (performance.now() - startTransform) + "ms")
    }
      
//       if (cachedOutput) {
//          if (output.code != cachedOutput.code) {
//            console.log("ERROR cached source is not similar! " + load.name)
//            console.log("CODE", output.code)
//            console.log("CACHED", cachedOutput.code)

//          }
//       }
      
    }
    
    
    // add babelHelpers as a dependency for non-modular runtime
    if (!babelOptions.modularRuntime)
      load.metadata.deps.push(externalHelpersPath);

    // set output module format
    // (in builder we output modules as esm)
    if (!load.metadata.format || load.metadata.format == 'detect' || load.metadata.format == 'esm')
      load.metadata.format = outputESM ? 'esm' : 'register';

    load.metadata.sourceMap = output.map;

    return output.code;
  });
};
