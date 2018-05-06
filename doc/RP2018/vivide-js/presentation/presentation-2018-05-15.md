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

<div class="title">
  RP 2018: Seminar on Reactive Programming - Hierarchical Data and Asynchronicity for VivideJS
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

# Context/Motivation

- 

---

# Design Space


---

# Done

- Tree View
- First level children

---

# Next Steps

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
