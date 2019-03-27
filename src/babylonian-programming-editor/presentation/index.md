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
</style>


![](babylonian_lion.png){style="width: 200px; position: absolute; right: 20px;  bottom: 20px;"}

<div class="title">
Babylonian-Style Programming 
</div>
<div class="subtitle">
Design and Implementation of a General-purpose Editor Integrating Live Examples Into Source Code
</div>

<div class="authors">
David Rauch, Patrick Rein, Stefan Ramson, Jens Lincke, and Robert Hirschfeld
</div>


<div class="credentials">
  <br>
Software Architecture Group<br>
Hasso Plattner Institute, University of Potsdam, Germany
  <br>
  <br>
  <b>‹Programming› 2019<br> Mon 1 - Thu 4 April 2019 Genoa, Italy</b>
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

## Existing Example-based Systems

![](example_based_systems.png){.centered}


---
## Babylonian-Style Programming Editor

![](babylonian-style_programming_editor.png){.centered}


---
## Demo

<browse://src/babylonian-programming-editor/demos/>

![](babylonian_demo.png){.centered}


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