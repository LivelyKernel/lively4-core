## 2019-06-17 Trying out Alexander Meissner's Parser

```javascript
import {ES6ModuleParser} from "https://lively-kernel.org/lively4/ES6Parser/Parser.js"
var parser = new ES6ModuleParser("foo.js", `class Foo {bar(a) { return a * 2 } }`)
parser.classes.Foo.methods.bar.sourceCode // { return a * 2
```

```javascript
var  parseURL = async function(url) {
  var source  = await lively.files.loadFile(url)
  return new ES6ModuleParser(url, source)
}
parseURL(lively4url + "/src/client/lively.js")
```



## Worspace for Parsing in FileIndex (old version)

```javascript
import FileIndex from "src/client/fileindex.js"


// FileIndex.current().updateAllVersions()

var versions, groups, topChanged;
var url = lively4url + "/src/client/lively.js";

var modifications = [];


var max = 10;
(async () => {
  var text = await lively.files.loadVersions(url).then(r => r.text())
  versions = JSON.parse(text).versions
  var last
  var counter = 0
  for (var ea of versions) {
    counter ++
    if (counter > max) return
    if (ea && last) {
      var mod = await FileIndex.current().findModifiedClassesAndMethods(url, ea, last)
      modifications.push(mod)
      console.log("modifications", mod)
    }
    last = ea
  }
})()
```

## Fixed FileIndex Analysis Bug

Methods where only identified by name, now "static" and "get set" are also considered. 

```javascript

import FileIndex from "src/client/fileindex.js"

var versions, groups, topChanged;
(async () => {
  var versionsTable = FileIndex.current().db.versions
  versions = await versionsTable.toArray()
  groups = _.groupBy(versions, ea => ea.class + ">>" + ea.method)
  topChanged = Object.keys(groups).map(ea => ({
    methodOfClass: ea, 
    count: groups[ea].length, 
    changes: groups[ea]
  })).sortBy(ea => ea.count)
    .reverse()
    .slice(0,100)
  
  topChanged[0].changes[0]
  
  topChanged.map(ea => "" + ea.count + " " + ea.methodOfClass ).join("\n")
})()

```

```
  // 360 Lively>>eventListeners
  // 283 Lively>>location
  // 135 ContextMenu>>openIn
  // 92 ContextMenu>>worldMenuItems
  // 81 VivideView>>input
  // 80 VivideView>>outportTargets
  // 75 TripleNotes>>initialize
  // 73 LivelyCodeMirror>>value
  // 49 Lively>>initializeDocument
  // 48 LivelyCodeMirror>>mode
```
  
  
  
