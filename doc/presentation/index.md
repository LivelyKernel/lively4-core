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

- Workspace <br> ![](workspace.png){style="width:300px"}
- Inspector
- Browser
- Search
- Test Runner
- Context Menu 

---

# Object Tools

- Halos
  - Drag and Drop
  - Copy
- Style Editor
- Component Bin
- Object Script Editor
  - Instance-specific Behaviors (similar to Parts in Webwerkstatt)
- Drawboard (#Pen)

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

- Debugger
- Console

---

# Experimental Tools

- X Ray 
- Generic Object Graph (#WIP)
- Module Dependencies 
- Boot / Loading Visualization (more domain specific that Chrome's standard tool)

--- 

## Experimental Language Features

- Technology: Babel Source Code Transformation
- Active Expressions

--- 

## Workspace

--- 

## Browser / Container

---

# Components

## D3 Visualizations
  
- Tree
- TreeMap
- Bundle View

## Graphviz (with D3)


-- 
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

# Related Work

- Lively Kernel 
  - Webwerkstatt 
  - Lively Web
  - Lively Next

--- 

# Future Work

- Loading is not optimized
  - lots of source code transformation while loading
  
  


