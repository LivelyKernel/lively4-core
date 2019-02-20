<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../doc/presentation/style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />


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
<!-- Context: What is the broad context of the work? What is the importance of the general research area? -->
### Context

Exploratory programming workflows are often only applicable to content residing inside dedicated environments, requiring special workflows or languages. 

<!-- E.g. special frameworks or languages are required. -->

---
<!-- 
 Inquiry: What problem or question does the paper address? How has this problem or question been addressed by others (if at all)? 
-->
### Inquiry  <!-- outside world cannot make use of cool inside tools -->

While working on programs and objects that are not created in such a special way one cannot make use of exploratory workflows. Further even when creating new content inside a special exploratory environment, it is hard make use of content and programs created outside of that environment.

<!-- web: effortless collaborative development (wiki vs. git workflow) -->

---
<!-- Approach: What was done that unveiled new knowledge? -->
### Approach <!-- (e.g. Smalltalk-like Lively Kernel objects and workflows) -->

To overcome the gap between explorable content created in special environments and outside content as HTML content and JavaScript programs, we create Lively4, a new environment that embraces standard HTML and JavaScript. HTML used to be only a generation target UI for frameworks other systems. In Lively4, we use HTML/JavaScript to build a collaborative, self-supporting exploratory development environment for all HTML/JavaScript content.

---
<!-- Knowledge: What new facts were uncovered? If the research was not results oriented, what new capabilities are enabled by the work? -->

### Knowledge
With this approach, we are pushing the boundaries of exploratory programming environments.
Given the restrictions of HTML and JavaScript, we can explore how working with documents, names, explicit references compares to working with pure object graph of special environments. 

<!-- Grounding: What argument, feasibility proof, artifacts, or results and evaluation support this work? -->
### Grounding

We build Lively4 environment in a self-supporting way,  which allowed us to develop, use and evolve tools and workflows from within it.

---
<!-- Importance: Why does this work matter? -->
**Importance:** 
Exploratory workflows can enrich HTML/JavaScript development experience.
Tools and environment can be easier to create if external contributions are easier to integrate 
and use.


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
  
  