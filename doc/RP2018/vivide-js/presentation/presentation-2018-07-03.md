<!-- markdown-config presentation=true -->

<script>
import { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"

let presentation = lively.query(this, "lively-presentation");
let slides = presentation.querySelectorAll('.lively-slide');
let ratio = "16-9";
slides.forEach(slide => {
  slide.classList += " ratio-" + ratio;
})
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
  Software Architecture Group <br />Hasso Plattner Institute<br /> University of Potsdam, Germany
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
<div class="title-1">Context</div>

<ul class="notes notes-big">
<li>Adapted System: Vivide</li>
<li>VivideJS with asynchronous data processing</li>

</ul>

---
<div class="title-1">Design Space</div>

<ul class="notes notes-big">
<li>Supported: </li>
  <ul>
  <li>Asynchronous scripts</li>
  </ul>
<li>Dropped:</li>
  <ul>
  <li></li>
  </ul>
</ul>

---
<div class="title-1">Implementation</div>

<img class="img-big" src="./vivide-classes.svg" alt="Vivide Class Hierarchy" />

---
<div class="title-1">Demo - Feature Overview</div>

<div class="first-50">
[
  {name: "object", subclasses:[{name: "morph"},]},
  {name: "list", subclasses:[{name: "linkedlist"}, {name: "arraylist"}]},
  {name: "usercontrol", subclasses:[{name: "textbox"}, {name: "button"}, {name: "label"}]},
]
</div>

<div class="second-50">
<script>
(async () => {
  let workspace = await (<lively-code-mirror></lively-code-mirror>);
  workspace.value = `[
  {name: "object", subclasses:[{name: "morph"},]},
  {name: "list", subclasses:[{name: "linkedlist"}, {name: "arraylist"}]},
  {name: "usercontrol", subclasses:[{name: "textbox"}, {name: "button"}, {name: "label"}]},
]`
  return workspace;
})()
</script>
</div>

---
<div class="title-1">Demo - Example 1</div>

<div class="first-50">
lively.findDependedModules('https://lively-kernel.org/lively4/lively4-thulur/src/client/lively.js')
</div>

<div class="second-50">
<script>
(async () => {
  let workspace = await (<lively-code-mirror></lively-code-mirror>);
  workspace.value = "lively.findDependedModules('https://lively-kernel.org/lively4/lively4-thulur/src/client/lively.js')";
  return workspace;
})()
</script>
</div>

---
<div class="title-1">Demo - Example 2</div>

<div class="first-50">
lively.findDependedModules('https://lively-kernel.org/lively4/lively4-thulur/src/client/lively.js')
</div>

<div class="second-50">
<script>
(async () => {
  let workspace = await (<lively-code-mirror></lively-code-mirror>);
  workspace.value = "fetch('https://lively-kernel.org/lively4/lively4-thulur/', {method: 'OPTIONS'}).then(r => r.json().then(j => j.contents))";
  return workspace;
})()
</script>
</div>

---
<div class="title-1">Insights</div>

<ul class="notes notes-big">
<li></li>
</ul>

---
<div class="title-1">Shortcomings</div>

<ul class="notes notes-big">
<li></li>
</ul>

---
<div class="title-1">Future Work</div>

<ul class="notes notes-big">
<li></li>
</ul>

---

# Todo

- Dauer: Jeweils 20 min. Redezeit + 10 min. Diskussion

- Kontext/Problemstellung/Motivation
  - An welchem System arbeitet ihr?
  - Welche Probleme gibt es?
  - Wie sieht das von euch angestrebte Ziel aus?
- Literatur / Related Work (falls zutreffend)
- Designraum
  - Verfahren/Ideen/Lösungsstrategien, die ihr in Betracht gezogen habt
  - Abwägung, warum ihr euch für eure letztendliche Lösung entschieden habt
- Implementierung
  - Skizze eurer Lösung
- Demo
- Insights
  - High-level Einsichten aus dem Projekt
- Shortcomings, Open Ends und Future Work

Im Gegensatz zum letzten Mal, liegt hier also der Fokus auf eure Designentscheidungen, die Implementierung, eure Demo sowie Einsichten aus eurem Projekt,
Worauf genau ihr euren Schwerpunkt legt, bleibt aber euch überlassen, da dies je nach Thema anders aussehen sollte.

Formalien:
* Titelfolie: Name, Thema, Datum, Seminar, Semester, Fachgebiet
* Foliennummern auf jeder (außer Titel-) Folie
* Vortrag und Diskussion sind eine Prüfungsteilleistung


---

# Close

<script>
let closeButton = document.createElement('button')
closeButton.innerHTML = 'close';
closeButton.addEventListener("click", () => {
  document.webkitCancelFullScreen();
  let slides = presentation.querySelectorAll('.lively-slide');
  
  slides.forEach(slide => {
    slide.style.transform = 'none';
    slide.style.position = 'relative';
  })
  
  presentButton.style.display = 'inline';
})
closeButton
</script>
