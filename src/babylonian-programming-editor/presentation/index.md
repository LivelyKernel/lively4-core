<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../../doc/presentation/style.css"  />
<link rel="stylesheet" type="text/css" href="../../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../../templates/livelystyle.css"  />

<style>
  .centered {
    display: block; 
    margin-left: auto; 
    margin-right: auto;
  }

  h2 {
    text-align: center;
  }
  
  
  a:visited.plain, a:link.plain {
    color: inherit;
    text-decoration: none;
  }

</style>


![](babylonian_lion.png){style="width: 200px; position: absolute; right: 20px;  bottom: 20px;"}

<div class="title">
<a class="plain" href="https://arxiv.org/pdf/1902.00549">
Babylonian-Style Programming 
</a>
</div>
<div class="subtitle">
Design and Implementation of a General-purpose Editor Integrating Live Examples Into Source Code
</div>

<div class="authors">
David Rauch, Patrick Rein, Stefan Ramson, Jens Lincke, and Robert Hirschfeld
</div>


<div class="credentials">
  <br>
  <a class="plain" href="https://www.hpi.uni-potsdam.de/hirschfeld/">Software Architecture Group<br>
Hasso Plattner Institute, University of Potsdam, Germany</a>
  <br>
  <br>
  <a class="plain" href="https://2019.programming-conference.org/"><b>‹Programming› 2019<br> Mon 1 - Thu 4 April 2019 Genoa, Italy</b></a>
</div>



<script>
import {pt} from "src/client/graphics.js"

var button = document.createElement("button")
button.textContent = "Timer"
button.onclick = () => {
  var id = "digital-clock"
  var open = document.querySelector("#" + id)
  if (open) { open.remove(); return}

  var clock = document.createElement("lively-digital-clock")
    clock.id = id
    lively.setPosition(clock, lively.pt(10, 0))
    lively.setExtent(clock, lively.pt(200,50))
    clock.style.opacity = 0.5
    lively.components.openIn(lively.query(this, "lively-container").getContentRoot(), clock)
}
button
</script>




----
## The Long Loop

![](the_long_loop.png){.centered}


---

## The Long Loop

![](the_long_loop_green.png){.centered}


---

## Live Programming

![](the_long_loop_live-programming.png){.centered}

---
## Concrete Examples vs Abstract Code

![](babylonian_figure1.png){.centered}

Live results for a concrete implementation (left) and an abstract implementation with live examples (right)

---

## Existing Example-based Systems

![](example_based_systems.png){.centered}

---
## Feature Space for Example-based Systems

Example: Set of input values for a function/method (example invocation) 


- Feedback on Runtime State
  - Feedback granularity
  - State over time
  - State over modules
  - Arbitrary objects
  - Domain-specific feedback
- Associating Examples with Code
  - Multiple examples for one part of the application
  - Reusing parts of examples	

{style="width:45%; float: left"}


- Specifying Context
  - Determining Relevant Sections of Code
  - Control flow
  - Runtime state
  - Program output
- Keeping Track of Assumptions {style="margin-top:10px"}
- Navigating the Trace{style="margin-top:10px"}

{style="width:45%; float: left"}


---
## Babylonian-Style Programming Editor

![](babylonian-style_programming_editor.png){.centered}


---
## Demo

<!--
<script>
(async () => {
  var demo = await lively.create("lively-markdown")
  demo.setContent(await fetch(lively4url + "/src/babylonian-programming-editor/demos/index.md").then(r => r.text()))
  return demo
})()
</script>
-->


![](babylonian_demo.png){.centered}

<browse://src/babylonian-programming-editor/demos/>


<!--

this.drawBranches(ctx, random, i+2, angle + random(0.3, 0.6), tipX + 1, tipY, width)

-->

---
## Babylonian-Style Programming Editor

- Feedback on Runtime State
  - Feedback granularity
  - State over time
  - State over modules
  - Arbitrary objects
  - Domain-specific feedback
- Associating Examples with Code
  - Multiple examples for one part of the application
  - Reusing parts of examples
- Specifying Context
- Determining Relevant Sections of Code
  - Control Flow
  - Runtime State
  - Program Output
- Keeping Track of Assumptions
- Navigating the Trace

{style="transform: scale(0.8); transform-origin: top left; width:45%; float: left"}


![](babylonian_demo.png){style="width: 500px; position: absolute; bottom: 40px; right: 20px"}

---

<script>
  // include title slide again here
  var title = lively.query(this, ".title")
  // linked styles are included by accident.... and it looks right because of that
  title ? title.parentElement.innerHTML : ""
</script>

---
<!-- #TODO pull this up into presentation? -->
<script>
// poor men's slide master #Hack #TODO How to pull this better into lively-presentation?
var ctx = this;
(async () => {
  await lively.sleep(500)
  var presentation = lively.query(ctx, "lively-presentation")
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