<!-- markdown-config presentation=true -->

<script>
// TODO: 
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"

let presentationSize = "hd";

lively.components.addTemplatePath(lively4url + "/doc/PX2018/project_2/")
lively.components.resetTemplatePathCache()
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
  let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  
  // Fit presentation into screen
  if (width >= 1920 && height >= 1080) {
    presentationSize = "fullhd";
  } else if (width >= 1600 && height >= 900) {
    presentationSize = "hd";
  } //else if (width >= 1280 && height >= 800) {
    //lively.notify("some strange resolution of HPI beamers")
  //}
  else {
    presentationSize = "standard-vga"
  }

  
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
  Programming Experience 2018:<br />- Material Point Method -
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

<ul class="notes notes-big">
<li>How can materials be simulate</li>
</ul>

---
<div class="title-1">Introduction</div>

<ul class="notes notes-big">
<li>How can materials be simulate<br><i class="fa fa-arrow-right"></i>Material Point Method</li>
</ul>

---
<div class="title-1">Introduction</div>

<ul class="notes notes-big">
<li>How can materials be simulate<br><i class="fa fa-arrow-right"></i>Material Point Method</li>
<li>How does it look like?</li>
</ul>
<iframe style="position: absolute; bottom: 50px; right: 50px;" width="50%" height="50%" src="https://www.youtube.com/embed/nXck0xs7oyw?start=150" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

---
<div class="title-1">Demo</div>

<script>
import boundEval from "src/client/bound-eval.js";

(async () => {
  let mpm = await (<lively-mpm></lively-mpm>);
  let containerClass = "mpm " + presentationSize;

  return <div><link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation.css" /><div class={containerClass}>{mpm}</div></div>;
})()
</script>

---

<div class="title-1">Challenges</div>

<ul class="notes notes-big">
<li>Particles & performance</li>
<li>Algorithms have different parameters</li>
<li>Preferable algorithm to explain a parameter</li>
<ul>
<li>Single point not suitable for E</li>
<li>Stretching material more suitable</li>
</ul>
<li>
Suitable controls for each parameter
<script>
(() => {
let sliderClass = "slider-" + presentationSize;
let img = <img class={sliderClass}/>;
img.src = "doc/PX2018/project_2/presentation/slider-control.png";
return <div><link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/presentation/presentation-2018-05-16.css" />{img}</div>;
})();</script>
</li>
<li>Exchangeability of examples algorithms</li>
</ul>

---
<div class="title-1">Outlook</div>

<ul class="notes notes-big">
<li>Explore the material point method with simple examples</li>
<li>Animations that show the influence of variables</li>
<ul>
<li>To simulate different materials</li>
<li>To simulate different behavior</li>
</ul>
<li>If manageable:<br />Explain how to create material out of particles</li>
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

---
<div class="title-1">References</div>

<ul class="notes notes-big">
<li><a href="https://i.stack.imgur.com/sSrFV.png">Slider Image</a></li>
</ul>
