<!-- markdown-config presentation=true -->

<!---

There are so many stories to tell... so many angles to approach... which one should it be?

--->



<link rel="stylesheet" type="text/css" href="../../doc/presentation/style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />

<style>

li:first-child {
    margin-top: 0px;
}

li {
  margin-bottom: -5px;
}

li:last-child {
    margin-bottom: 10px;
}

ul {
  list-style: none;
}

ul  li::before{
  content: "■"; /* □ */ 
  color: rgb(255, 142, 0);
  display: inline-block; 
  width: 1.2em;
  position: relative;
  top: -4px;
  font-size: 12pt;
  margin-left: -1.2em;
}

ul  li li::before{
  content: "□"; 
  color: rgb(255, 142, 0);
  display: inline-block; 
  width: 1.2em;
  position: relative;
  top: -4px;
  font-size: 12pt;
  margin-left: -1.2em;
}



</style>

<div class="title">
  Lively4: An Exploratory <br> Web-Programming Environment
</div>

<div class="authors">
  Jens Lincke, Stefan Ramson, Robert Hirschfeld
</div>

<div class="credentials">
  2019<br>
  <br>
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
  <br>
  <br>
  Shonan Meeting No.147 <br>
  on Self-supporting, Extensible Programming Languages and Environments <br>
  for Exploratory, Live Software Development
</div>

----
##  Context
- Development Environments for Exploratory programming  
- require: special workflows, frameworks or languages
- Classic Smalltalk: persistent, pure, fully reflectional object graph
- Our own project: Lively Kernel (Smalltalk/Morphic in a browser)
  - Subset of JavaScript (custom Smalltalk-like class system)
  - Full serializable object graph
  - Reflective Morphic UI
  
<!-- TODO insert picture of webwerkstatt here.... -->  

---
## Inquiry / Problem  <!-- outside world cannot make use of cool inside tools -->

1. Excludes working on content and programs not created 
   <br> in specific environment/framework/language
2. Hard make use of content and programs 
   <br> created outside of that environment

<!-- TODO show (1) and (2) here -->
![](lively4-inquiry){style="position: absolute;   bottom: 50px; left: 30%; right: 30%"}

<!-- web: effortless collaborative development (wiki vs. git workflow) -->

---
<!-- Approach: What was done that unveiled new knowledge? -->
## Approach <!-- (e.g. Smalltalk-like Lively Kernel objects and workflows) -->

- To overcome the gap between 
  - explorable content created in special environments
  - outside content as HTML content and JavaScript programs  
- We create Lively4
  - a new environment that fully embraces standard HTML and JavaScript
  - HTML used to be only a generation target UI for frameworks other systems
- In Lively4, we use HTML/JavaScript to build a 
  - collaborative
  - self-supporting 
  - exploratory development environment 
  - for HTML/JavaScript content

---
<!-- Knowledge: What new facts were uncovered? If the research was not results oriented, what new capabilities are enabled by the work? -->
## Knowledge

- Pushing boundaries of exploratory programming environments
  - Given the restrictions of HTML and JavaScript
- Compare working with 
  - Documents, names, explicit references (Lively4) 
  - Pure object graph of special environments  (Lively Kernel / Smalltalk)

---
<!-- Grounding: What argument, feasibility proof, artifacts, or results and evaluation support this work? -->
## Grounding

- Build Lively4 environment in a self-supporting way
- which allowed us:  
  - develop, use and evolve 
  - tools and workflows from within it.

---
<!-- Importance: Why does this work matter? -->
## Importance

- Exploratory workflows can enrich HTML/JavaScript development experience
- Tools and environment can be easier to create if external contributions are easier to integrate and use

--- 
### Demos

- Self-supporting Environment
  - Markdown wiki / Presentation
  - HTML source code editing vs. manipulating HTML Elements and serialization
- Work on stuff outside the environment...
  - Working on HTML Element DOM
    - Halo
    - XRay / Elements Under (Example for Object-specific Behavior / Parts Workflow)
  - Lively4-chrome extension
- Reuse external content and programs
  - CodeMirror for text editing
  - DrawIO for figures
  - D3 Visualization
  - GraphViz for graph layout
  - JavaScript, HTML, Markdown parser  
  - ...

...

---
... ... 

---
... ...  ...

---
## Background: Lively Kernel
- Self-supporting System
  - all development can be done from within itself
- Web-based Development Environment -> **Lively Wiki**
  - mostly client side

----
## Lively4 
- lively4-core
  - start.html: boot lively4 into empty page
  - local storage: all content in body is locally persisted 
    - feels like Smalltalk image
- lively4-server 
  - manages files
  - synchronization with GitHub
- lively4-chrome-extension

---
## Technologies
- HTML, JavaScript, CSS
- SystemJS modules (better control than native modules)
- Babel (JavaScript source code transformation)
  - new language features
  - allows us own experimental features (see ActiveExpressions)
  - more control over source code (access into module state)
- Web-components

---
## Applications
- Markdown Wiki with scripts and components
- see [Lively 4 Tools and Workflows](../../doc/presentation/index.md#)

---
### Ideas in Lively4

- Embrace low-tech Markdown vs. rich text editing  
- #Hashtag Navigation
- Modules to separate behavior
- Web-components as abstraction
- #ShadowRoot as natural border for serialization

---