<!-- markdown-config presentation=true -->

<!---

There are so many stories to tell... so many angles to approach... which one should it be?

--->



<link rel="stylesheet" type="text/css" href="../../doc/presentation/style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />

<style>


</style>

<div class="title">
  Lively4: An Exploratory <br> Web-Programming Environment
</div>

<div class="authors">
  Jens Lincke, Stefan Ramson, Robert Hirschfeld
</div>

<div class="credentials">
  <br>
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
  <br>
  <br>
  Shonan Meeting No.147 <br>
  on Self-supporting, Extensible Programming Languages and Environments <br>
  for Exploratory, Live Software Development
  <br><br>Feb 2019
  
</div>

----
## Development Environments for Exploratory programming  
- **Require**: special workflows, frameworks or languages
- Classic Smalltalk: persistent, pure, fully reflectional object graph
- Our own project: Lively Kernel (Smalltalk/Morphic in a browser)
  - Subset of JavaScript (custom Smalltalk-like class system)
  - Full serializable object graph
  - Reflective Morphic UI
  
<!-- TODO insert picture of webwerkstatt here.... -->  

---
## Inside/Outside <-> Content/Code  <!-- outside world cannot make use of cool inside tools -->

1. Excludes working on content and programs not created 
   <br> in specific environment/framework/language
2. Hard make use of content and programs 
   <br> created outside of that environment

<!-- TODO show (1) and (2) here -->
![](lively4-inquiry){style="position: absolute;   bottom: 0px; right: 0px}

<!-- web: effortless collaborative development (wiki vs. git workflow) -->

---
<!-- Approach: What was done that unveiled new knowledge? -->
## From Lively Kernel to Lively4 <!-- (e.g. Smalltalk-like Lively Kernel objects and workflows) -->

- To overcome the gap between 
  - Explorable content created in special environments
  - Outside content as HTML content and JavaScript programs  
- We create Lively4
  - New environment that fully embraces standard HTML and JavaScript
  - HTML used to be only a generation target UI for frameworks other systems
- In Lively4, we use HTML/JavaScript to build a 
  - Collaborative
  - Self-supporting 
  - Exploratory development environment 
  - For HTML/JavaScript content

---
<!-- Knowledge: What new facts were uncovered? If the research was not results oriented, what new capabilities are enabled by the work? -->
## Lively4

- Pushing boundaries of exploratory programming environments
  - Given the restrictions of HTML and JavaScript
- Compare working with 
  - Documents, names, explicit references (Lively4) 
  - Pure object graph of special environments  (Lively Kernel / Smalltalk)
- Build Lively4 environment in a self-supporting way
- Develop, use and evolve **tools** and **workflows** from within it

---
<!-- Importance: Why does this work matter? -->
##  Conclusion 

1. Exploratory workflows can enrich <br>HTML/JavaScript development experience
2. Tools and environment can be easier to create 
  <br> if external contributions are easier to integrate and use

--- 
## Demos

- Self-supporting Environment
  - Markdown wiki with scripts and components (e.g. this presentation)
  - HTML source code editing vs. manipulating HTML Elements and serialization
  - Editing files vs. structural editing of packages/classes/methods (#TODO)
- Work on stuff outside the environment
  - Working on HTML Element DOM
    - Morphic Halo for all HTML Elements 
    - XRay / ElementsUnder (example for object-specific behavior / #PartsWorkflow)
  - Lively4-chrome extension
- Reuse external content and programs
  - CodeMirror for text editing
  - DrawIO for figures
  - D3 Visualization
  - GraphViz for graph layout
  - JavaScript, HTML, Markdown parser  


---
... ...  ...

---
## Background: Lively Kernel
- Self-supporting System
  - All development can be done from within itself
- Web-based Development Environment -> **Lively Wiki**
  - Mostly client side


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
## Ideas in Lively4

- Embrace low-tech Markdown vs. rich text editing  
- #Hashtag Navigation
- Modules to separate behavior
- Web-components as abstraction
- #ShadowRoot as natural border for serialization

--- 
## More Demos

- "Drag and Drop" and "Copy and Paste"
- ACM vs. Academics ?
- Files and Polymorphic Identifiers (Plex Demo / #Broken?)


---


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