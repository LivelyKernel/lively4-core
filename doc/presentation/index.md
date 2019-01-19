<!-- markdown-config presentation=true -->

<!-- #TODO make style links in container content relative to url -->
<!-- <link rel="stylesheet" type="text/css" href="style.css" /> -->
<link rel="stylesheet" type="text/css" href="./style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />

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

<script>
  import {presentationPrintButton} from "src/client/essay.js"
  presentationPrintButton(this)
</script>

<script>
  import {presentationFullscreenButton} from "src/client/essay.js"
  presentationFullscreenButton(this)
</script>

---

# Contents

<script>
var list = document.createElement("ul")
_.filter(lively.findWorldContext(this).querySelectorAll("h1"),
  ea => ea.textContent != "Contents"
).forEach(ea => {
  list.appendChild(<li><a click={
      (evt) => {
        evt.stopPropagation();
        evt.preventDefault();
        lively.query(this, "lively-container").followPath("#" + ea.textContent)
      }
    }
    href={"#" + ea.textContent}>{ea.textContent}</a></li>)
})
list

// var l=<ul>{... 
// [<li>1</li>,<li>2</li>]
// }
// <li>{3 + 4}</li>
// </ul>
// l
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
#  Standard Tools

- [Workspace](browse://doc/presentation/workspace.html) <br> ![](workspace.png){style="width:300px"}
- Inspector
- Browser
- Search
  - Server-side regex search
  - Client-side search in FileIndex (IndexDB)
- Test Runner
- Context Menu 
- Github Sync

---
# Object Tools

- Halos
  - Drag and Drop
  - Copy
- #StyleEditor
- #ComponentBin
- Object Script Editor
  - Instance-specific Behaviors (similar to Parts in Webwerkstatt)
- #Drawboard (#Pen)

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
# Experimental Tools

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

### Widgets:
- #Connector
- #CrayonColors
- #Dialog
- #Menu
- Separator
- Script


### Text Editing:
- LivelyEditor
- LivelyCodeMirror

### Content:
- #LivelyMarkdown
- #LivelyPresentation
- #LivelyEssay
- #PDF
- #Paper
- #Table

### UI

- Error
- Notification
- Progress


## #D3 Visualizations
  
- #D3Tree
- #D3TreeMap
- #D3RadialTree
- #D3Barchart
- #D3Boxplot
- #D3BundleView


## #Graphviz (with D3)


---
# Research Paper 

- Babylonian Programming
- Live Programming Web-components

## Drafts

- https://lively-kernel.org/lively4/overleaf-cop18-promises/content/implementation.md
  - #Aysnc #COP with #Promises and syntax support
  - #LiterateProgramming / #ActiveEssay Library / Environment


---
# Applications

## Live Remote Programming Environment for Pi

- Source Code editing of Python files
- Python Terminal 
- Live DoIts and PrintIts from Editor

## Media Browser

- Plex Media API

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


## Paper Writing

- writing markdown (directly include in LaTeX)
- 

---
# Features

- #Windows
  - vs. pure pane and tab layout of typical websites 
- #Markdown
  - bundles (directory with index.md and linked content) #LivelyContainer


## UI

- Expose <br> ![](expose.png){style="width:300px"}

---
# Documentation

- [User stories](../stories.md)
- [Developer Journal](../journal/index.html)


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
// poor men's slide master
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
""
</script>

