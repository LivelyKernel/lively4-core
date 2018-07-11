<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"
import { hideHiddenElements, toggleLayer, showVariable, runExampleButton } from "src/client/essay.js";
import livelyMpm from 'doc/PX2018/project_2/lively-mpm.js'

const showDetails = false;
let presentation = lively.query(this, "lively-presentation");
let slides = presentation.querySelectorAll('.lively-slide');
let ratio = "16-9";
slides.forEach(slide => {
  slide.classList += " ratio-" + ratio;
  
  if (showDetails) {
    let detailsElements = slide.querySelectorAll('.details');
    
    for (let detailsElement of detailsElements) {
      detailsElement.classList.remove('hidden');
    }
  }
});

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
let presentButton = document.createElement('button');
presentButton.innerHTML = 'present';
presentButton.addEventListener("click", async () => {
  document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  // wait for fullscreen
  await lively.sleep(100);

  let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let scaling = width / slides[0].clientWidth;
  
  slides.forEach(slide => {
    slide.style.transform = 'scale(' + scaling + ')';
    slide.style.transformOrigin = 'top left';
    slide.style.position = 'fixed';
    slide.style.zIndex = '10001';
  })

  presentButton.style.display = 'none';
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
  Programming Experience 2018<br />- Material Point Method -
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

<div class="title-1">Introduction</div>


- Describe Domain
- Where is it used
- Related Work

---

<div class="title-1">Demo</div>

<script>
import boundEval from "src/client/bound-eval.js";

(async() => {
  let mpm = await (<lively-mpm></lively-mpm>);
  mpm.explanation = ["Grid elements with adjacent nodes",
                    "Particles (Mesh generator: gmsh)"];
  
  return <div><link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation.css" /><div class="mpm">{mpm}</div></div>;
})()
</script>

<div class="details hidden">
<!--<audio controls>
  <source src="young-modulus.ogg" type="audio/ogg">
  Your browser does not support the audio tag.
</audio>-->

```javascript {.ShowCode .Hidden}
let url = lively4url + '/doc/PX2018/project_2/elasticbodies.js';
lively.openComponentInWindow("lively-container").then(comp => comp.editFile("" + url));
```
<script>runExampleButton("Show Code", this, ["ShowCode"])</script>
<script>hideHiddenElements(this)</script>
</div>

---

<div class="title-1">Related Work</div>

<ul class="notes notes-big">
<li><a href="http://prod.sandia.gov/techlib/access-control.cgi/1993/937044.pdf">A particle method for history-dependent materials</a></li>
<li><a href="https://www.researchgate.net/publication/262415477_Material_point_method_basics_and_applications">Material point method: basics and applications</a></li>
<li><a href="https://infoscience.epfl.ch/record/255783/files/Bachelor%20Project%20Report%20MPM.pdf">Shape functions</a></li>
</ul>

---

<div class="title-1">Math</div>

<div class="notes h-1-2">
<ul class="notes-big">
<li><script>
import latexconv from "src/external/latex-to-unicode-converter.js";
"Continuum body <strong>" + latexconv.convertLaTeXToUnicode("\\Omega") + "</strong> discretized into material points <strong>p</strong>";
</script> 
</li>
<li><strong>p</strong></li>
</ul>
</div>

<div class="h-2-2">
<script>
import CircleMesh from 'doc/PX2018/project_2/circlemesh.js';
import boundEval from "src/client/bound-eval.js";
(async() => {
  let animation = await (<presentation-animation></presentation-animation>);
  let points = await CircleMesh.gmsh(50, 300, 100);
  let steps = [];
  steps.push({ "body": { type: "circle", radius: 50, x: 300, y: 100, color: "rgba(255, 0, 0, 1)", filled: true } });
  steps.push({ "particles": { type: "points", value: points, color: "rgba(255, 0, 0, 1)" } });
  animation.animationSteps = steps;  
  return <div><link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation.css" /><div class="animation">{animation}</div></div>;
})()
</script>
</div>

---

# TODOs

- Connect grid nodes
- Alter speed
- Show parts of the animation canvas zoomed

---

<div class="title-1">MPM Steps (TODO: + Example Animation)</div>

<ul class="notes notes-big">
<li>Particles To Nodes:
<ul>
<li></li>
</ul>
</li>
<li>Nodes To Particles:
<ul>
<li></li>
</ul>
</li>
</ul>

---

<div class="title-1">Elastic Bodies (Example: Shape Function)</div>

<script>
import latexconv from "src/external/latex-to-unicode-converter.js"
latexconv.convertLaTeXToUnicode("\\sigma + \\alpha + \\Omega + n\\sub{p} = 5")
</script>

---

<div class="title-1">Elastic Bodies (Example: Movement)</div>

---

# Close

<script>
let closeButton = document.createElement('button')
closeButton.innerHTML = 'close';
closeButton.addEventListener("click", closeFullscreen);

function closeFullscreen() {
  document.webkitCancelFullScreen();
  let slides = presentation.querySelectorAll('.lively-slide');
  slides.forEach(slide => {
    slide.style.transform = 'none';
    slide.style.position = 'relative';
    slide.style.zIndex = '1';
  })
  
  presentButton.style.display = 'inline';
}

closeButton
</script>
