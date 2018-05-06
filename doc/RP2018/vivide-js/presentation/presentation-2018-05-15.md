<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"
</script>
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">

<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css"  />
<link rel="stylesheet" type="text/css" href="src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css"  />

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
  }
  
  .lively-slide.fullscreen .title-frontpage {
    color: #2B547E;
    font-weight: bold;
    font-size: 40pt;
    width: calc(100% - 40px);
    top: 25%;
    text-align: center;
    position: absolute;
  }
  
  .lively-slide.fullscreen .title-1 {
    color: #2B547E;
    font-weight: bold;
    font-size: 40pt;
    position: absolute;
    top: 50px; 
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

---
<div class="title-1">Design Space</div>


---
<div class="title-1">Done</div>

- Tree View
- First level children

---
<div class="title-1">Next Steps</div>

- Complete Tree View

  - Processing 

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