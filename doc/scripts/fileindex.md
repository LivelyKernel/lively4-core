# FileIndex


## Remove a Directory from Index

```javascript
import FileIndex from 'src/client/fileindex.js'

FileIndex.current().removeDirectory("http://localhost:9005/Dropbox/Thesis/Literature/")
```


## Update Class Overview


```javascript
import FileIndex from 'src/client/fileindex.js';


var classes = await FileIndex.current().db.classes.toArray()

var interesting = classes
  .filter(ea => ea.url.startsWith(lively4url + "/") && ea.url.match("ai-workspace"))
  .map(ea => ea.name + " " + ea.url)
  
duplicates.join("\n")


var jsFiles = files.filter(ea => ea.match(/\.js$/))


var stale = await FileIndex.current().db.classes
  .where('url').noneOf(files.filter(ea => ea.match(/\.js$/)))
  .filter(cls => cls.url.startsWith(lively4url))
  .toArray()
  


console.log(`Deleting ${stale.length} stale classes from ${lively4url}:`)
stale.forEach(c => console.log(`  ${c.name} - ${c.url}`))

// Then delete
await FileIndex.current().db.classes
  .where('url').noneOf(files.filter(ea => ea.match(/\.js$/)))
  .filter(cls => cls.url.startsWith(lively4url))
  .delete()

await FileIndex.current().db.classes.where('url').noneOf(files.filter(ea => ea.match(/\.js$/))).filter(cls => cls.url.startsWith(lively4url)).delete()

```


## Query Classes and Methods

```javascript
import FileIndex from 'src/client/fileindex.js';

let allClasses = await FileIndex.current().db.classes.toArray();
let classData = allClasses
  .filter(ea => ea.url.startsWith(lively4url +"/"))
  .filter(ea => ea.url.match("ai-workspace/"))
  .filter(ea => ea.name.match("Lively"))

// Example Class:
//   end: 18253
//   loc: 559
//   methods: []
//   name: "LivelyAgentBoard"
//   nom: 21
//   start: 1374
//   superClassName: "Morph"
//   superClassUrl: "http://localhost:9005/lively4-core/src/components/widgets/lively-morph.js"
//   url: "http://localhost:9005/lively4-core/src/ai-workspace/components/lively-agent-board.js"
  
// Example Method"
//   end: 2236
//   kind: "method"
//   loc: 5
//   name: "addFileRead"
//   start: 2094
//   static: false

var result = ""

for(let eaClass of classData) {
  result += `## ${eaClass.name} \n`
  for(let eaMethod of eaClass.methods.filter(ea => ea.kind == "method")) {
    result += `- ${eaClass.static ? "static" : ""} ${eaMethod.name}\n`
  }
  result += `\n`
}


result
```