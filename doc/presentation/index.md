<!-- markdown-config presentation=true -->

<!-- #TODO make style links in container content relative to url -->
<!-- <link rel="stylesheet" type="text/css" href="style.css" /> -->
<link rel="stylesheet" type="text/css" href="./style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />

<style>
  li.box {
    width: 250px;
    height: 150px;
    list-style-type: none;
    float: left;
    border: 1px solid lightgray;
    margin: 10px;
    overflow: hidden;
  }
  h1,h2,h3,h4  {
    clear: left;
  }

  li.leftright {
    list-style-type: none;
    float:left; 
    width:400px;
  }
</style>
<style>



</style>

<!--
<script>
  var thatIsMe  = this
  var button = document.createElement("button")
  button.textContent = "show me"
  button.onclick = async () => {
    lively.showElement(thatIsMe)
  }
  button
</script>
-->

<div class="title">
  Lively 4 Tools and Workflows
</div>

<div class="authors">
  Jens Lincke, Stefan Ramson, Robert Hirschfeld
</div>

<div class="credentials">
  2019<br>
  <br>
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

---

# Contents

<script>
var style = document.createElement("style") 
style.innerHTML = `
li {
  list-style-type: disk;
}

li.h2 {
 margin-left: 40px;
 list-style-type: circle;
 font-size: 10pt;
}
`
this.shadowRoot.appendChild(style)

var list = document.createElement("ul")
_.filter(lively.findWorldContext(this).querySelectorAll("h1,h2"),
  ea => ea.textContent != "Contents"
).forEach(ea => {
  list.appendChild(<li class={ea.localName}><a click={
      (evt) => {
        evt.stopPropagation();
        evt.preventDefault();
        lively.query(this, "lively-container").followPath("#" + ea.textContent)
      }
    }
    href={"#" + ea.textContent}>{ea.textContent}</a></li>)
})
list
</script>

---
# Motivation

- Collaborative Self-supporting Development Environment
  - Web-Technologoies: HTML and JavaScript (Vanilla, but bleeding edge)
- What is Lively4
  - Environment
  - Tools
  - Workflow

---
# Tools
##  Standard Tools

- [Workspace](browse://doc/presentation/workspace.html) <br> ![](media/workspace.png){style="width:300px"}
- Inspector
- Browser
- Search
  - Server-side regex search
  - Client-side search in FileIndex (IndexDB)
- Test Runner
- Context Menu 
- Github Sync

---
## Object Tools

- Halos
  - Drag and Drop
  - Copy
- #StyleEditor
- #ComponentBin
- Object Script Editor
  - Instance-specific Behaviors (similar to Parts in Webwerkstatt)
- #Drawboard (#Pen)

---
## Experimental Tools

- #XRay 
- Generic Object Graph (#WIP)
- Module Dependencies 
- Boot / Loading Visualization (more domain specific that Chrome's standard tool)
- Knot, Triple, ...
- #ASTExplorer
- Babylonian Programming Editor
- #Bibtex
- #ContinousEditor
- #LivelyFilesystems (mounting external Web-resources)
- #Vivide


---
# Lively Server

- (Terminal)

---
# Service Worker

- Caching
- Mounting Web-services

---
# Host Tools (Chrome)

Even though we experimented with using our own Console and Debugger, we struggled to implement a self-supporting debugger inside of Lively4 using the chrome debugger API. We succeeded in allowing to debug a second tab or window, but at that point we can also use the default debugger. 

- #Debugger
- #Console

--- 
# Seminar Demos

- #Blockchain
- #CloudScripting
- #GithubExplorer
- Simulated Annealing
- Semantic Soruce Code Navigator
- #Services
- #Whyline

---
# Demos

- #BouncingBall
- #SoapBubble

--- 

## Experimental Language Features

- Technology: Babel Source Code Transformation
- #ActiveExpressions
- #PolymorphicIdentifier
  - [poid.js](browse://src/client/poid.js)



---
# Components

## Widgets:
- #Connector
- #CrayonColors
- #Dialog
- #Menu
- Separator
- Script

---
## Text Editing:

### [LivelyCodeMirror](open://lively-code-mirror)
![](media/lively-codemirror.png){style="width:300px; float: right; margin-left: 50px"} {style="list-style-type: none;"} 
  - powerfull editor of a text buffer
  - syntax highlighting and code completion
  - custom widgets and editor UI enhancements

### [LivelyEditor](open://lively-editor) 
![](media/lively-editor.png){style="width:200px; float: right; margin-left: 100px"} {style="list-style-type: none;"} 
  - can edit files (urls)
  - can resolve conflicts with server and other editors
  - threewaymerge 
  
  
---
## Lively Content:
- #LivelyMarkdown ![](media/lively-motivation.png){style="width:200px"} {.box}
- #LivelyPresentation ![](media/lively-presentation.png){style="width:200px"} {.box}
- #LivelyEssay {.box}
- #PDF [seminar](https://lively-kernel.org/lively4/lively4-seminars/WebDev2017/project_3/index.md)<br>![](media/lively-pdf.png){style="width:200px"} {.box}
- #Table ![](media/lively-table.png){style="width:200px"} {.box} 
- #LivelyDrawboard ![](../../src/components/widgets/lively-drawboard.png){style="width:200px"} {.box} 
---
## UI Components

- #LivelyError <br> ![](media/lively-error.png)  {.box}
- #LivelyNotification <br> ![](media/lively-notifications.png)  {.box}
- #LivelyProgress <br> ![](media/lively-progress.png)  {.box}
- #LivelyPrompt <br> ![](media/lively-prompt.png) {.box}
- #LivelyConfirm <br> ![](media/lively-confirm.png) {.box}

---
## #D3 Visualizations
  
- #D3TreeMap <br> [![](media/treemap_filesize.png){style="width:300px"}](../../demos/visualizations/treemap_size.md) {.box}
- #D3RadialTree <br> ![](../../src/components/d3/d3-radialtree.png){style="width:300px"} {.box} 
- #D3Barchart <br> ![](../../src/components/d3/d3-barchart.png){style="width:300px"} {.box} 
- #D3Boxplot <br> ![](../../src/components/d3/d3-boxplot.png){style="width:300px"} {.box}
- #D3BundleView <br> [![](media/bundleview_modules_contextjs.png){style="width:300px"}](../../demos/visualizations/bundleview.md) {.box}
- #D3PolymetricView <br> [![](media/d3_polymetricview.png){style="width:300px"}](../../demos/visualizations/polymetricview.md) {.box}

---
## #Graphviz (with D3)

- Interactive Object Graph <br> [![](media/graphviz_objectgraph.png){style="width:300px"}](../../demos/visualizations/object_graph.md)


---
# Research Paper 

- Babylonian Programming
- Live Programming Web-components

## Drafts

- [COP Promises](<https://lively-kernel.org/lively4/overleaf-cop18-promises/content/implementation.md>)
  - #Aysnc #COP with #Promises and syntax support
  - #LiterateProgramming / #ActiveEssay Library / Environment


---
# Applications

## Live Remote Programming Environment for Pi

- Source Code editing of Python files
- Python Terminal 
- Live DoIts and PrintIts from Editor

## Media Browser

- #Plex Media API [plex-media](open://plex-media)


## Chrome Extension

- Load Lively4 on any Web-page
- Some features are not supported 
  - e.g. booting without service worker is slow

---
# Workflows

- Editing source code in #CodeMirror
  - Modules are updated 
  - Templates are updated
    - Elements in DOM are migrated to get live feedback #LiveProgramming
      - feedback even on changes in templates and `initialize` methods
      - problem: object identities changes #FutureWork
- Inspecting DOM Elements
  - changing attributes of a DOM element in #Inspector, (similar to #Chrome tools)
- File Searching (server vs. client)
- Creating Presentations
- Creating Active Essays
- Editing Python source code 
  - Running Python programs #Terminal
  - Using #PrintIt and #DoIt in #CodeMirror
- Drawing Sketch with a #Pen

---
## Essay

- [ContextJS Paper Draft / Implementation](https://lively-kernel.org/lively4/overleaf-cop18-promises/content/implementation.md) <br> ![](media/lively-essay.png){style="width:500px"}

---
## Paper Writing

- writing markdown (directly include in LaTeX)<br> ![](media/paperwriting.png){style="width:500px"}

---
# Features

- #Windows
  - vs. pure pane and tab layout of typical websites 
- #Markdown
  - bundles (directory with index.md and linked content) #LivelyContainer


## UI

- Expose <br> ![](media/expose.png){style="width:300px"}

---
# Documentation

- [User stories](../stories.md)
- [Developer Journal](../journal/index.md)


## Misc

- [Journal Entry: Loose Ends](../journal/2018-08-23.md)

---
# Open Questions

## Transient Objects / #ObjectIdentity?

How to bridge persistent text and transient objects? E.g. an open inspector in a self-contained squeak image is easy to persist, but the object the inspector inspected is gone when it is loaded again. Should it point to the next best similar object, or even the object the user takes to be the same object after loading? How to treat object identity? Is the `document.body` object  always the same? 

We experimented with making object identity explicit when opening tools on them. But this would change an object the moment we look at them! We would kill the cat in Heisenberg terms on a very macro level. 

--- 
# Related Work

- Lively Kernel 
  - #Webwerkstatt 
  - #LivelyWeb
  - #LivelyNext

---
##  Lively Kernel

### Missing in Lively4
- full featured #PartsBin and corresponding workflow
- Lively Bindings: connections over changes in properties
- Structured System Browser (Editing Modules/Class/Methods vs. Directories/Files)

### Alternative 

- Richtext editing vs. Markdown editing (with editing in HTML View)
- Object serialization vs. Document serialization
  - Objects vs. DOM Elements are dominant and persistent structure 
- Parts based core UI vs. Component based UI

--- 
# Future Work

- Loading is not optimized
  - lots of source code transformation while loading
  
---
## #Meta

- How to navigate inside a presentation?

---
<!-- #TODO pull this up into presentation? -->
<script>
// poor men's slide master #Hack #TODO How to pull this better into lively-presentation?
(async () => {
  await lively.sleep(500)
  var presentation = lively.query(this, "lively-presentation")
  if (presentation && presentation.slides) {
    presentation.slides().forEach(ea => {
      var img = document.createElement("img")
      img.classList.add("logo")
      img.src="https://lively-kernel.org/lively4/lively4-seminars/PX2018/media/hpi_logo.png" 
      img.setAttribute("width", "50px")
      ea.appendChild(img)
      var div = document.createElement("div")
      div.classList.add("page-number")
      ea.appendChild(div)
    });
  } 
  return ""
})()
</script>

