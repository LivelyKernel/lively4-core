<!-- #TODO make style links in container content relative to url -->
<link rel="stylesheet" type="text/css" href="style.css" />
<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css"  />
<link rel="stylesheet" type="text/css" href="../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../templates/livelystyle.css"  />

<div class="title">
  PX 2018: Seminar on Programming Experience
</div>

<div class="authors">
  Jens Lincke, Stefan Ramson, Patrick Rein, Marcel Taeumel, Robert Hirschfeld
</div>

<div class="credentials">
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
  }
</style>

--- 

# Abstract

Active Essays and Explorable Explanations is a form of interactive media that can help understand complex systems for many relevant domains.
In particular, the domain of software design is filled with challenging algorithms, patterns, and systems that are hard to understand and master. 
In this seminar, the participants will create demos, tools, and applications based on the idea of Explorable Explanations to improve the programming experience when developing such systems.
By using our live collaborative development environment, Lively4, they will share, explore, and adapt the created tools and explanations --- even in unanticipated ways.


---
# Topics


<script>
// Poor men's: Table of Content / Topic list... I always wanted to do this in PowerPoint... but I did not know how to use Macros...
(async () => {
  var container = lively.query(this, "lively-container")
  var source = await fetch(container.getURL()).then(r => r.text())
  var topics = source.split("\n").filter(ea => ea.match(/^## Topic/)).map(ea => <li>{ea.replace(/## Topic\: /,"")}</li>)

  // #Idea, instead of just printing a TOC in the view, we could materialize them as content and update the topic number? 
  // #Contra, maybe this should be very static and done by hand to use them as references....
  var ul = <ul>{...topics}</ul>
  return ul
})()
</script>

---
## Topic: Entity Component System

- links/resources
- [Anatomy of a Knockout](http://www.chris-granger.com/2012/12/11/anatomy-of-a-knockout/)

---
## Topic: Material Point Method

---
## Topic:  Parser Combinators


---
## Topic: Conflict-free replicated data type

- Domain: Distributed Computing
- [Conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)


---

## Topic: Neuronal Networks

- Domain: AI
- Deep Learning

---
## Topic: Support Vector Machine

- Domain: AI

---
## Topic: Monte Carlo Tree Search

- Domain: AI
- Example Application: Alpha Go KI 
  - [Silver, David, et al. "Mastering the game of Go with deep neural networks and tree search" ](https://pdfs.semanticscholar.org/1740/eb993cc8ca81f1e46ddaadce1f917e8000b5.pdf)


---
## Topic: Z3 (Complex Constraint Solver, SMT) 

- Domain: Constraints Solving

---
## Topic: Constraint Solver (Vergleich)
  - Cassowary
  - Gradient Descent
  - Backtracking/Backtalk

---
## Topic: Prolog

---
## Topic: Path finding Algorithm (Comparison, Dijstra, A*)


---
## Topic: Regular Expressions
  - NFA- and DFA vs. Backtracking

---
## Topic: Alpha-beta pruning (AI, Treesearch)

<img src="topic_alpha_betta.png"></img>

---
## Topic: Learnable Programming 1. Follow the flow


<img src="topic_learnable_programming_1.png"></img>

---
## Topic: Learnable Programming 2. See the state

<img src="topic_learnable_programming_2.png"></img>


---
## Topic: Learnable Programming 3. Create by reacting


<img src="topic_learnable_programming_3.png"></img>


---
## Topic: Learnable Programming 4. Create by abstracting


<img src="topic_learnable_programming_4.png"></img>


---
## Topic: Stable Treemaps

- Domain: Visualization Algorithms
- Voronoi tree maps, see [Sebastian Hahn @ hpi](https://hpi.de/doellner/people/current/schmechel.html)


---
## Topic: Graph Layouting 

- Domain: Visualization algorithms
- Compare:
  - Simulated Annealing
  - Force Layout
  - ...



---
## Topic: Blockchain
  - ...

---
## Topic:  GPU Graph Base Search

- @Stefan?

---
## Topic: Your Topic!



---

<script>
// poor men's slide master
var presentation = lively.query(this, "lively-presentation")
if (presentation) {
  presentation.slides().forEach(ea => {
    var img = document.createElement("img")
    img.classList.add("logo")
    img.src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/hpi_logo.png" 
    img.setAttribute("width", "50px")
    ea.appendChild(img)

    var div = document.createElement("div")
    div.classList.add("page-number")
    ea.appendChild(div)
  });
}

""

</script>


<script>
  var button = document.createElement("button")
  button.textContent = "print"
  button.onclick = async () => {
   var presentation = lively.query(this, "lively-presentation")
   presentation.exportPrint()
  }
  button
</script>