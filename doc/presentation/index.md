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
- #Serivces
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

- Editing source code vs. working with objects
- File Searching (server vs. client)

---
# Features

- Windows
- Markdown


---
# Open Questions

## Transient Objects / #ObjectIdentity?

How to bridge persistent text and transient objects? E.g. an open inspector in a self-contained squeak image is easy to persist, but the object the inspector inspected is gone when it is loaded again. Should it point to the next best similar object, or even the object the user takes to be the same object after loading? How to treat object identity? Is the `document.body` object  always the same? 

We experimented with making object identity explicit when opening tools on them. But this would change an object the moment we look at them! We would kill the cat in Heisenberg terms on a very macro level. 

--- 
# Related Work

- Lively Kernel 
  - Webwerkstatt 
  - Lively Web
  - Lively Next

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

