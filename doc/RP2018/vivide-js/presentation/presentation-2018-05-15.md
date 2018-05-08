<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"

let presentationSize = "big";
</script>
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation.css">

<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css" />
<link rel="stylesheet" type="text/css" href="src/client/lively.css" />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css" />

<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
    page-break-before: always;
  }
  
  p {
    font-size: 18pt
  }
  @media print {
    .lively-slide {
      page-break-before: always;
      border: 0px solid white;
/*       border: 2px solid blue; */
    }      
  }
  
</style>

<script>
let presentation = lively.query(this, "lively-presentation");
let presentButton = document.createElement('button');
presentButton.innerHTML = 'present';
presentButton.addEventListener("click", () => {
  let slides = presentation.querySelectorAll('.lively-slide');
  
  slides.forEach(slide => {
    slide.className += ' fullscreen-' + presentationSize;
  })
  presentButton.style.display = 'none';
  prevButton.style.display = 'none';
  nextButton.style.display = 'none';
})

if (presentation && presentation.slides) {
  presentation.slides().forEach(ea => {
    var img = document.createElement("img")
    img.classList.add("logo")
    img.src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/hpi_logo.png" 
    img.setAttribute("width", "50px")
    ea.appendChild(img)

    var div = document.createElement("div")
    div.classList.add("page-number")
    ea.appendChild(div)
  });
}

presentButton
</script>

<div class="title-frontpage">
  RP 2018: Seminar on Reactive Programming<br />- Hierarchical Data and Asynchronicity for VivideJS -
</div>

<div class="authors">
  Sebastian Koall
</div>

<div class="credentials">
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

<script>
  var button = document.createElement("button")
  button.textContent = "print"
  button.onclick = async () => {
   var presentation = lively.query(this, "lively-presentation")
   presentation.print()
  }
  button.style = "position: absolute; bottom: 10px; left: 10px"
  button
</script>


--- 
<div class="title-1">Context/Motivation</div>

<ul class="notes notes-big">
<li>System: VivideJS</li>
<li>Provide data in a task-oriented form</li>
<li>Live programming environment in the internet<br><i class="fa fa-arrow-right"></i> Provide insights into the processed data</li>
<li>Explore data by utilizing different views</li>
<li>Adapt the views while exploring the data</li>
</ul>

---
<div class="title-1">Design Space</div>

<ul class="notes notes-big">
<li>Advanced properties</li>
<ul>
<li>Width, height</li>
<li>Color, background color</li>
</ul>
<li>Improved view connection management</li>
<li>Processing asynchronous data</li>
<li>Merging data from two sources</li>
</ul>

---
<div class="title-1">Done</div>

<ul class="notes notes-big">
<li>Scripts are saved in the corresponding view</li>
<li>First level of descents + tree view: <div class="inline"><script>openComponent('vivide-view', 'Vivide View')</script></div></li>
</ul>

<img style="position: absolute; bottom: 100px; left: calc(10% + 10px); width: 80%; max-width: 100%;" alt="Hier hätte ein Vivide View und sein Script Editor erscheinen müssen..." src="./vivide-view.png" />

---
<div class="title-1">Next Steps</div>

<ul class="notes notes-big">
<li>Improve scripting</li>
  <ul>
  <li>Unique scripts ids</li>
  <li>Provide further properties</li>
  </ul>
<li>Multi-level hierarchies</li>
  <ul>
  <li>Scripts for each level</li>
  <li>Children are processed on demand</li>
  </ul>
</ul>

---

# Close

<script>
let closeButton = document.createElement('button')
closeButton.innerHTML = 'close';
closeButton.addEventListener("click", () => {
  let slides = presentation.querySelectorAll('.lively-slide');
  
  slides.forEach(slide => {
    slide.className = slide.className.replace('fullscreen-' + presentationSize, '');
  })
  
  presentButton.style.display = 'inline';
})
closeButton
</script>