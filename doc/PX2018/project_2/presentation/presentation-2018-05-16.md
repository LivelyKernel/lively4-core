<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"

let presentationSize = "big";
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
  
  .lively-slide.fullscreen-small {
    position:fixed;
    width: 1024px;
    height: 768px;
    box-sizing: border-box;
    background-color: #fff;
    z-index: 10001;
  }
  
  .lively-slide.fullscreen-big {
    position:fixed;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #fff;
    z-index: 10001;
  }
  
  .lively-slide .title-frontpage {
    color: #2B547E;
    font-weight: bold;
    font-size: 26pt;
    width: calc(100% - 40px);
    top: 25%;
    text-align: center;
    position: absolute;
  }
  
  .lively-slide.fullscreen-big .title-frontpage {
    font-size: 44pt;
  }
  
  .lively-slide .authors {
    position: absolute;
    width: calc(100% - 40px);
    text-align: center;
    top: 300px;
    font-size: 20pt;
  }
  
  .lively-slide.fullscreen-big .authors {
    top: 500px;
    font-size: 32pt;
  }
  
  .lively-slide .credentials {
    position: absolute;
    width: calc(100% - 40px);
    text-align: center;
    top: 400px;
    font-size: 18pt;
  }
  
  .lively-slide.fullscreen-big .credentials {
    top: 700px;
    font-size: 28pt;
  }
  
  .lively-slide .notes {
    position: absolute;
    left: 100px;
    top: 120px;
  }
  
  .lively-slide.fullscreen-big .notes {
    position: absolute;
    left: 250px;
    top: 230px;
  }
  
  .lively-slide .notes li {
    font-size: 24pt;
    line-height: 1.5em;
  }
  
  .lively-slide.fullscreen-big .notes li {
    font-size: 36pt;
    line-height: 2em;
  }
  
  .lively-slide .title-1 {
    color: #2B547E;
    font-weight: bold;
    font-size: 36pt;
    position: absolute;
    top: 40px; 
    width: calc(100% - 40px);
    text-align: center;
  }
  
  .lively-slide.fullscreen-big .title-1 {
    font-size: 50pt;
    top: 75px; 
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

<ul class="notes">
<li></li>
</ul>

---
<div class="title-1"># Related Work</div>

<ul class="notes">
<li>Material point method: basics and applications](https://www.researchgate.net/profile/Vinh_Phu_Nguyen/publication/262415477_Material_point_method_basics_and_applications/links/00463537ab99f084f0000000/Material-point-method-basics-and-applications.pdf)</li>
<li>[The Material Point Method for the Physics-Based Simulation of Solids and Fluids](https://www.math.ucla.edu/~jteran/student_thesis/jiang.pdf)</li> 
<li>[Stefan's Javascript implementation](https://github.com/onsetsu/floom/)</li>
</ul>

---
<div class="title-1">Concept</div>

<ul class="notes">
<li>(TBD) Some general information on how MPM works</li>
<li>HIGH LVL only 10 mins of presentation</li>
<li>Grids + particles that are moved around on them</li>
</ul>

---
<div class="title-1">Outlook</div>

<ul class="notes">
<li>(TBD) What will my active essay show</li>
<li>(TBD) "Paper" prototype or simple example if possible</li>
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
