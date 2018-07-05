<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"
import { hideHiddenElements, toggleLayer, showVariable, runExampleButton } from "src/client/essay.js";

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
# Introduction

---

<div class="title-1">Young Modulus</div>

<script>
import boundEval from "src/client/bound-eval.js";

(async() => {
  let mpm = await (<lively-mpm></lively-mpm>);
  mpm.explanation = ["Alternative name: elastic modulus",
                    "Describes stiffness of solid materials"];
  mpm.inputVariable = { "name": "youngModulus", "min": 0.001, "max": 2, "step": 0.001 }
  
  return <div><link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation.css" /><div class="mpm">{mpm}</div></div>;
})()
</script>

<div class="details hidden">
<audio controls>
  <source src="young-modulus.ogg" type="audio/ogg">
  Your browser does not support the audio tag.
</audio>

```javascript {.ShowCode .Hidden}
let url = lively4url + '/doc/PX2018/project_2/vibratingpoint.js';
lively.openComponentInWindow("lively-container").then(comp => comp.editFile("" + url));
```
<script>runExampleButton("Show Code", this, ["ShowCode"])</script>
<script>hideHiddenElements(this)</script>
</div>



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