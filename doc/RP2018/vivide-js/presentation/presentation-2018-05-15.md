<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"
</script>
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">

<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css" />
<link rel="stylesheet" type="text/css" href="src/client/lively.css" />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css" />

<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
    page-break-before: always;
  }
  
  .lively-slide.fullscreen {
    position:fixed;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #fff;
    z-index: 10001;
  }
  
  .lively-slide.fullscreen .title-frontpage {
    color: #2B547E;
    font-weight: bold;
    font-size: 44pt;
    width: calc(100% - 40px);
    top: 20%;
    text-align: center;
    position: absolute;
  }
  
  .lively-slide.fullscreen .authors {
    position: absolute;
    width: calc(100% - 40px);
    text-align: center;
    top: 500px;
    font-size: 32pt;
  }
  
  .lively-slide.fullscreen .credentials {
    position: absolute;
    width: calc(100% - 40px);
    text-align: center;
    top: 700px;
    font-size: 28pt;
  }
  
  .lively-slide.fullscreen .notes {
    position: absolute;
    left: 250px;
    top: 220px;
  }
  
  .lively-slide.fullscreen .notes li {
    font-size: 36pt;
    line-height: 2em;
  }
  
  .lively-slide.fullscreen .title-1 {
    color: #2B547E;
    font-weight: bold;
    font-size: 50pt;
    position: absolute;
    top: 75px; 
    width: calc(100% - 40px);
    text-align: center;
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
    slide.className += ' fullscreen';
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

<ul class="notes">
<li>Test</li>
<li>Bla</li>
<li>Foo</li>
<li>Test</li>
</ul>

---
<div class="title-1">Design Space</div>

<ul class="notes">
<li>Test</li>
<li>Bla</li>
<li>Foo</li>
<li>Test</li>
</ul>

---
<div class="title-1">Done</div>

<ul class="notes">
<li>Test</li>
<li>Bla</li>
<li>Foo</li>
<li>Test</li>
</ul>

---
<div class="title-1">Next Steps</div>

<ul class="notes">
<li>Test</li>
<li>Bla</li>
<li>Foo</li>
<li>Test</li>
</ul>

---

# Close

<script>
let closeButton = document.createElement('button')
closeButton.innerHTML = 'close';
closeButton.addEventListener("click", () => {
  let slides = presentation.querySelectorAll('.lively-slide');
  
  slides.forEach(slide => {
    slide.className = slide.className.replace('fullscreen', '');
  })
  
  presentButton.style.display = 'inline';
})
closeButton
</script>