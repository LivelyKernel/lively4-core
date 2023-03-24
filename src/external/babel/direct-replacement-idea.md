Put a Babel7 transform directly in babel6 and cover more and more modules

In plugin-babel6.js

```JavaScript
    var output
    // console.log(`[BABEL7] any ${load.address}`)
    if (babelOptions.USE_BABEL7) {
      // const pluginBabel7 = await System.import("src/external/babel/plugin-babel7.js")
      // console.log(`[BABEL7] load ${load.address}`)
      try {
        console.log(`[BABEL7] B7start ${load.address}`)
        output = await BABEL7_TRANSFORM_SOURCE(load, babelOptions, config)
      } catch(e) {
        console.log(`[BABEL7] B7error ${load.address}`, e)
      } finally {
        console.log(`[BABEL7] B7end ${load.address}`)
      }
    } else if (babelOptions.babel7) {
      try {
        console.log(`[BABEL7] b7start ${load.address}`)
        const pluginBabel7 = await System.import("src/external/babel/plugin-babel7.js")
        output = await pluginBabel7.transformSource(load, babelOptions, config)
      } catch(e) {
        console.log(`[BABEL7] b7error ${load.address}`, e)
      } finally {
        console.log(`[BABEL7] b7end ${load.address}`)
      }
    } else {
      try {
        console.log(`[BABEL7] start ${load.address}`)
        output = babel.transform(load.source, config);  
      } catch(e) {
        console.log(`[BABEL7] error ${load.address}`, e)
      } finally {
        console.log(`[BABEL7] end ${load.address}`)
      }
    }

    var cache = {
        input:load.source, 
        output: output.code, 
        map: output.map
    }

    if (self.lively4transpilationCache) {
      self.lively4transpilationCache.update(cacheKey, cache)      
    }
    
    if (!self.babelTransformTimer) self.babelTransformTimer = []
    self.babelTransformTimer.push({
      name: load.name,
      size: load.source.length,
      time: (performance.now() - startTransform)
    })
  }

  var performanceTime = performance.now() - startTransform;
  if (cachedOutputCode) {
    debugLog("[plugin-babel] CACHED output " + performanceTime + "ms")
  } else { 
    debugLog("[plugin-babel] UPDATE transformed " + load.name + " in " + performanceTime + "ms")
  }
  bootLog(load.name, Date.now(), cachedOutputCode ? "cached" : "transpiled", performanceTime )

  // add babelHelpers as a dependency for non-modular runtime
  if (!babelOptions.modularRuntime)
    load.metadata.deps.push(externalHelpersPath);

  // set output module format
  // (in builder we output modules as esm)
  if (!load.metadata.format || load.metadata.format == 'detect' || load.metadata.format == 'esm')
    load.metadata.format = outputESM ? 'esm' : 'register';

  load.metadata.sourceMap = output.map;

  return output.code;
};

async function BABEL7_TRANSFORM_SOURCE(load, babelOptions, config) {   
  await System.import("src/external/babel/babel7.js")
  
  const babel7 =  window.lively4babel
  const babel7babel =  babel7.babel
  
  let output
  try {
    const { resolveModuleSource, ...newConfig } = config;
    debugger
    output = babel7babel.transform(load.source, newConfig);      
  } catch(e) {
    console.log("[BABEL7] ERROR TRANSPILING CODE WITH BABEL7:", e)
    throw e
  }
  return output
}
```

In src/systemjs-config.js

```JavaScript
const moduleOptionsNon = {
  babelOptions: {
    {+USE_BABEL7: true,+}
    es2015: false,
    stage2: false,
    stage3: false,
  
```

Problem:

the systemjs babel plugin expects an old version of babel that supports setDynamic (which is not in babel7)
