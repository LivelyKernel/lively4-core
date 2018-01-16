<style>

@media print {
  body {
    font-family: Helvetica, Arial, Sans-Serif;
  }
  hr {
    page-break-before: always;
    color: white;
  }  
}

img {
  max-width: 900px;
}

.lively-slide {
  position: absolute;
  top: 0px;
  left: 0px;
  width:   923px; /* 20/13 * 600 */
  height: 600px;
  
  border: solid 2px rgb(240,240,240);
  padding: 20px;
  transform-origin: top left;
  transform: scale(1.17)
}

.title, .authors, .credentials, .conference {
  margin-top: 30px;
  text-align: center;
}

.title {
  margin-top: 150px;
  margin-bottom: 30px;
  font-size: 26pt;
  color: #1C6BA0;
  font-weight: bold;
}

.authors, .credentials {
  font-size: 18pt;
  margin-top: 60px;
}

.credentials, .conference {
 font-size: 14pt;
}

.logo {
  position: absolute;
  top: 20px;
  right: 20px;
}

.page-number {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

h1 {
 font-size: 30pt;
}

h2 {
 font-size: 24pt;
}

ul li {
  font-size: 18pt;
  padding: 3px;
  margin-top: 6px;
  line-height: 115%;
}

ul li ul li {
  font-size: 16pt;
  padding: 2px;
  margin-top: 5px;

}

/* ul, li {
  border: solid red 1px;
}
 */
</style>

<img class="logo" src="./hpi_logo.png" width="50px">



<div class="title">
Designing a Live Development Experience <br> for Web Components
</div>

<div class="authors">
<u>Jens Lincke</u>, Stefan Ramson, Patrick Rein, <br> Robert Hirschfeld, Marcel Taeumel, Tim Felgentreff
</div>

<div class="credentials">
Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>


<div class="conference">
PX/17.2, October 22, 2017, Vancouver, Canada
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
    lively.setPosition(clock, pt(0, 0))
    lively.components.openIn(lively.query(this, "lively-container"), clock)
}
button
</script>
---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

<!-- - Level of Preserving Context -->

# Live Development of Web Components

- Background 
  - Lively Kernel, a Smalltalk like development environment in the browser 
- Motivation 
  - Transfer programming experience of Lively Kernel to plain HTML 
  - No new framework or new language for better live programming
  - But better live programming with HTML and JavaScript
- Problem 
  - No full control of framework, because of standard browser technology
  - Plain HTML does not provide abstractions
  - JavaScript does not provide enough reflection
  - Web Components provide abstraction, but lack run-time development support
- Approach
  - Preserve the context while giving immediate feedback through instance migration

---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

# Lively Kernel Development Experience

- Morphic framework with Halo tools 
- Evolve tools and applications while using them 
- Wiki-like collaboration while working on code and objects

![BouncingBallDynamicSystem](./bouncing_ball_dynamic_system.png "Bouncing ball: when the domain lends itself to it, a programmer can develop some parts of an application with continuous feedback, just by editing code that will patched into the system.")


<script>
import {pt} from "src/client/graphics.js"
import Ball from "src/components/demo/lively-ball.js"

var button = document.createElement("button")
button.textContent = "Bouncing Ball"
button.onclick = () => {
  var id = "bouncingball"
  var open = document.querySelector("#" + id)
  if (open) { open.remove(); return}

  Ball.livelyExample().then(container => {
    container.id = id
    lively.setPosition(container, pt(30, 170))
    lively.query(this, "lively-container").appendChild(container) 
  })
}
button
</script>



<!--
<script>
import {pt} from "src/client/graphics.js"

var button = document.createElement("button")
button.textContent = "Bouncing Balls Canvas"
button.onclick = () => {
  var id = "bouncingball"
  var open = document.querySelector("#" + id)
  if (open) { open.remove(); return}

  var ball = document.createElement("lively-bouncing-ball")
  ball.id = id
  lively.setPosition(container, pt(30, 170))
  lively.components.openIn(
    lively.query(this, "lively-container"), ball)  
}
button
</script>

-->
---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>
    
# Lively4

- Programming Experience in a Web-based Self-supporting Environment
  - Collaborative, though wiki like GitHub backed approach
  - Live / explorative in a Smallalk / Lively Kernel like way
  - <u>BUT:</u> ... with just "standard" Web technology?
- Lively4: New implementation of Lively Kernel ideas, tools, practices 
  - Make use of other plain JavaScript and HTML technology to easier build the environment
  - Allow to target content not created directly in Lively4 with our tools
- Long list of desired features, e.g.:
  - Be loadable into any Web page (directly or through browser extensions)
  - Use cloud resources for loading, mixing, and storing content


---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

# Web Components in Modern Browsers

![TemplateAndInstances](./template_and_instances.png "Web Components: the new elements in (B) are defined in (A), but at run-time the template is copied and the structure is redundant (C).")

---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

<!-- # Live Web Component Migration -->

# Live Web Component Migration 

- JavaScript objects and HTML elements
- Object mutation and HTML element migration
- Approach
  - Modify the source code of Web Components (HTML and JS) 
  - Control the instantiation (use the latest template and class)
  - Existing instances are migrated 
  - Run initialization code and (re-)applying the persisted state
- Challenges
  - Loosing object identity
  - "Stale code" and dangling event listeners
  - Performance due to potentially big scope of reloads
  - Level of preserving context (white vs black listing)
  - Dynamic elements in static templates

---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

# Different Kinds of Feedback in the System

![SoapBubble](./soap_bubble.png "The static description of a soap bubble and its resulting behavior at run-time.")

<script>
import {pt} from "src/client/graphics.js"
import Soap from "src/components/demo/lively-soapbubble.js"

var button = document.createElement("button")
button.textContent = "Soapbubble"
button.onclick = () => {
  var id = "soapbubble"
  var open = document.querySelector("#" + id)
  if (open) { open.remove(); return}
  Soap.livelyExample().then(container => {
    container.id = id
    lively.setPosition(container, pt(30, 170))
    lively.query(this, "lively-container").appendChild(container) 
  })
}
button
</script>

<!--

--- 
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

# Related Work

- Squeak / Smalltalk 
- Lively Kernel
- Live Programming
- Cascading Tree Sheets

-->

--- 
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

# Conclusion

- Contributions 
  - Explorative and live programming experience in a Web-based environment
  - Working with plain HTML elements vs. special framework
  - Live programming experience for Web Components
- Design Decisions
  - Object graph vs. DOM (references vs. explicit name) 
  - Mutable vs. immutable past (migration vs. mutation)
- Ongoing challenge
  - Practical usability vs live and explorative programming experience

---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>

<div class="title">
Designing a Live Development Experience <br> for Web Components
</div>

<div class="authors">
<u>Jens Lincke</u>, Stefan Ramson, Patrick Rein, <br> Robert Hirschfeld, Marcel Taeumel, Tim Felgentreff
</div>

<div class="credentials">
Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

---
<img class="logo" src="./hpi_logo.png" width="50px">
<div class="page-number">X</div>


## Designing a Live Development Experience <br> for Web Components

- Explorative and live development environments 
  - Flourish the most when they can impose restrictions
  - Enhance the experience of editing code: immediate feedback and direct manipulation 
- Example: Lively Kernel's user interface (UI) framework Morphic 
  - Working with graphical objects in direct way 
  - Giving immediate feedback during development. 
- Lively4 
  - Similar development experience 
  - Targeting general HTML elements. 
- New abstraction mechanism: Web Components 
  - Use plain HTML as building blocks for our tools
  - <u>But:</u> miss proper capabilities to support run-time development
- Approach 
  - Use object migration to provide immediate feedback



<div class="conference">
PX/17.2, October 22, 2017, Vancouver, Canada
</div>


