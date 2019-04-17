## 2019-04-17 #Performance 


## Performance of Compent Loading... is bad
```javascript
lively.time(() => fetch("https://lively-kernel.org/lively4/lively4-jens/README.md").then(r => r.text())) //RESOLVED: 8.365000001504086

lively.time(() => lively.create("lively-container")) // RESOLVED: 5.724999995436519
```



```javascript
lively.time(() => lively.create("lively-bibtex")) 

// first time: 670.6750000012107
//   2ms    found module filename
//   3ms    found template filename
//   199ms  module exists
//   297ms  module loaded
//   450ms  template exits
//   452ms  template loaded
//   652ms  registered
// second time: 1.6150000010384247


import Components from "src/client/morphic/component-loader.js"

lively.time(() => Components.loadByName("lively-bibtex"))

// RESOLVED: 356.2699999893084
// 0ms  found module filename
// 1ms  found template filename
// 175ms  module exists
// 177ms  module loaded
// 336ms  template exits
// 338ms  template loaded
// 352ms registered
```

## Performance bug: checking for existence and file structure...

```javascript
import Components from "src/client/morphic/component-loader.js"
var name  = "lively-bibtex"


var modUrl
lively.time(async () => modUrl = await Components.searchTemplateFilename(name + '.js')) 
// RESOLVED: 0.20000000949949026

lively.time(() => fetch(modUrl, { method: 'OPTIONS'}))  

import files from "src/client/files.js"

lively.time(() => files.exists(modUrl))RESOLVED: 120036.93499999633RESOLVED: 120041.80500000063RESOLVED: false


// RESOLVED: 175.38500000955537
```


## Files... cache existence

```javascript
import fileindex from "src/client/fileindex.js"
   
    
lively.time(() => fileindex.current().db.files.where("url").equals(modUrl).count())


import Files from "src/client/files.js"

var map = Files.cachedFileMap()

map.get(modUrl)

Files.fillCachedFileMap()
```

Side note, we found a but in the server:

```javascript
Files.exists(modUrl + "/xxx") // #BUG lively4server cannot answer this
```

and we are fast now

```javascript
lively.time(() => Files.exists(modUrl)) // RESOLVED: 0.035000004805624485
lively.time(() => Files.exists(modUrl + "xxx")) //RESOLVED: 14.739999998360872
```

So when to use and when not to use it?

