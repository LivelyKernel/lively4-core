## 2023-06-28 #hack debug into property access

*Author: @JensLincke*




```javascript
var config = System._getConfig()
var meta = config.meta


Object.defineProperty(config, "meta", {
  get() {
    debugger
    return meta
  }
})
```

With this, we found this code in 0.20.x System.js:


```javascript

function setMeta (config, key, metadata) {
  metadata.load = metadata.load || createMeta();

  // apply wildcard metas
  var bestDepth = 0;
  var wildcardIndex;
  for (var module in config.meta) {
    wildcardIndex = module.indexOf('*');
    if (wildcardIndex === -1)
      continue;
    if (module.substr(0, wildcardIndex) === key.substr(0, wildcardIndex)
        && module.substr(wildcardIndex + 1) === key.substr(key.length - module.length + wildcardIndex + 1)) {
      var depth = module.split('/').length;
      if (depth > bestDepth)
        bestDepth = depth;
      extendMeta(metadata.load, config.meta[module], bestDepth !== depth);
    }
  }

  // apply exact meta
  if (config.meta[key])
    extendMeta(metadata.load, config.meta[key]);

  // apply package meta
  if (metadata.packageKey) {
    var subPath = key.substr(metadata.packageKey.length + 1);

    var meta = {};
    if (metadata.packageConfig.meta) {
      var bestDepth = 0;

      getMetaMatches(metadata.packageConfig.meta, subPath, function (metaPattern, matchMeta, matchDepth) {
        if (matchDepth > bestDepth)
          bestDepth = matchDepth;
        extendMeta(meta, matchMeta, matchDepth && bestDepth > matchDepth);
      });

      extendMeta(metadata.load, meta);
    }

    // format
    if (metadata.packageConfig.format && !metadata.pluginKey)
      metadata.load.format = metadata.load.format || metadata.packageConfig.format;
  }
}
```