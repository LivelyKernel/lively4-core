## 2019-06-14

## 100 Most often changed methods?

After loading and parsing all versions of all methods and indexing them... we can do the following...

Should I have done it in #VivideJS #DataScripting 

```javascript
import FileIndex from "src/client/fileindex.js"

var versions, groups;
(async () => {
  
var versionsTable = FileIndex.current().db.versions


versionsTable.count()

versions = await versionsTable.toArray()
  
versions[1]
versions.map(ea => ea.method)

groups = _.groupBy(versions, ea => ea.class + ">>" + ea.method)

  
Object.keys(groups).map(ea => ({methodOfClass: ea, count: groups[ea].length})).sortBy(ea => ea.count).reverse().slice(0,100).map(ea => "" + ea.count + " " + ea.methodOfClass ).join("\n")
```






})()


```
 360 Lively>>eventListeners
283 Lively>>location
135 ContextMenu>>openIn
92 ContextMenu>>worldMenuItems
81 VivideView>>input
80 VivideView>>outportTargets
75 TripleNotes>>initialize
73 LivelyCodeMirror>>value
49 Lively>>initializeDocument
48 LivelyCodeMirror>>mode
48 AddTriple>>initialize
46 Container>>setPath
42 ContextMenu>>items
41 ServiceWorker>>fetch
36 Lively>>loaded
33 Lively>>reloadModule
33 BabylonianProgrammingEditor>>initialize
32 Keys>>handle
30 Scheme>>scheme
29 Node>>draw
29 Lively>>openBrowser
29 KnotSearchResult>>addKnot
28 ViewNav>>enable
27 Lively>>notify
25 VivideView>>myCurrentScript
24 Lively>>openWorkspace
23 LivelyCodeMirror>>setupEditorOptions
23 AddTriple>>save
22 LivelyContainerNavbar>>show
22 Lively>>openComponentInWindow
22 HTML>>fixLinks
21 ResearchDiary>>currentEntryURL
21 LivelyCodeMirror>>loadModules
21 ContextMenu>>targetMenuItems
20 Lively>>registerTemplate
20 DropElementHandler>>handle
20 ComponentLoader>>loadUnresolved
19 Selecting>>handleSelect
19 Persistence>>current
19 Container>>onSave
18 Lively>>getPosition
18 Filesystem>>stat
17 VivideView>>applyScript
17 Preferences>>load
17 LivelyCodeMirror>>printResult
17 Lively>>updateTemplate
17 ComponentLoader>>loadByName
16 VivideView>>calculateOutputModel
16 ServiceWorker>>constructor
16 Filesystem>>write
16 Container>>editFile
16 ComponentLoader>>register
15 VivideView>>newDataFromUpstream
15 Lively>>showClassSource
15 Lively>>openSearchWidget
15 Lively>>openContextMenu
15 Lively>>import
15 KnotView>>loadKnot
15 Graffle>>onKeyDown
14 VivideScriptEditor>>setScripts
14 VivideScriptEditor>>initialize
14 ViewNav>>showDocumentGrid
14 TraceNode>>mapToNodeType
14 ContextMenu>>openComponentInWindow
14 Container>>showNavbar
14 Container>>initialize
14 Container>>appendHtml
14 Clipboard>>onPaste
13 VivideView>>updateWidget
13 TripleNotes>>zoomTranslateY
13 TripleNotes>>zoomTranslateX
13 TripleNotes>>zoomScale
13 Selecting>>handleMouseUp
13 Lively>>showSource
13 Lively>>loadJavaScriptThroughDOM
13 Lively>>fillTemplateStyles
13 Graffle>>onMouseDown
13 ComponentLoader>>getTemplatePaths
13 Clipboard>>pasteHTMLDataInto
12 Node>>constructor
12 LivelyCodeMirror>>changeModeForFile
12 Lively>>handleError
12 KnotInput>>initialize
12 GraphControl>>initialize
12 Graph>>createTriple
12 Graffle>>onMouseUp
12 Filesystem>>read
12 Dictionary>>constructor
12 Container>>listingForDirectory
12 ComponentLoader>>searchTemplateFilename
12 BabylonianProgrammingEditor>>load
11 Window>>title
11 Window>>allWindows
11 VivideView>>computeModel
11 Snapping>>snapTo
11 ScriptStep>>nextStep
11 ScriptManager>>findLively4Script
11 ProbeWidget>>_update
11 LivelyMarkdown>>updateView
11 LivelyDrawio>>src
```