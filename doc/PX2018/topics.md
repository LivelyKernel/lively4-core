<!-- markdown-config presentation=true -->

<!-- #TODO make style links in container content relative to url -->
<!-- <link rel="stylesheet" type="text/css" href="style.css" /> -->
<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css"  />
<link rel="stylesheet" type="text/css" href="src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css"  />

<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
    page-break-before: always;
/*     border: 2px solid red
 */
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

<!--
<script>
  var thatIsMe  = this
  var button = document.createElement("button")
  button.textContent = "show me"
  button.onclick = async () => {
    lively.showElement(thatIsMe)
  }
  button
</script>
-->

<div class="title">
  PX 2018: Seminar on Programming Experience
</div>

<div class="authors">
  Jens Lincke, Stefan Ramson, Patrick Rein, Marcel Taeumel, Robert Hirschfeld
</div>

<div class="credentials">
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

<script>
  import {presentationPrintButton} from "src/client/essay.js"
  presentationPrintButton(this)
</script>

<script>
  import {presentationFullscreenButton} from "src/client/essay.js"
  presentationFullscreenButton(this)
</script>


--- 

# Abstract

<!-- #TODO get rid of this formatting #Hack -->
<div style="height:10%"></div> 

[Active Essays](http://www.playfulinvention.com/emergence/active-essay.html) and [Explorable Explanations](http://explorabl.es/) is a form of interactive media that can help understand complex systems for many relevant domains.
In particular, the domain of software design is filled with challenging algorithms, patterns, and systems that are hard to understand and master. 
In this seminar, the participants will create demos, tools, and applications based on the idea of Explorable Explanations to improve the programming experience when developing such systems.
By using our live collaborative development environment, [Lively4](https://lively-kernel.org/lively4/lively4-core/start.html), they will share, explore, and adapt the created tools and explanations --- even in unanticipated ways.


---

<!-- #SWD12 -->
# What will this Seminar be about?

- Design ideas
  - Algorithms 
  - Patterns

- Found in all kinds of software systems 
  - Programming languages
  - Frameworks 
  - Libraries
  - Applications

---

# How to present the idea

- Implement the idea in a new environment / language
- Generate visualizations and animations 
- Goal: make the idea better understandable


---

# Examples

- [A* vs Dijstra Path Finding Algorithms](https://www.redblobgames.com/pathfinding/a-star/introduction.html)
- [Explorable Explanations](http://explorabl.es/) 


---

# Implementation Platforms

<table style="margin-left: 10px; margin-top: 100px; text-align: center; font-size: 20pt;" > 
  <tr >
    <td width="40%"><img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/logo_squeak.png" height="200px"></td>
    <td width="40%"><img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/lively4_logo.png" height="200px"></td>
  </tr>
  <tr>
    <td><a href="http://squeak.org">Squeak (Smalltalk)</a></td>
    <td><a href="https://lively-kernel.org/lively4/lively4-core/start.html">Lively4</a>: JavaScript, Web components</td>
  </tr>
</table>

---
# Topics

<!-- #Idea make TOC navigate-able? Goto slide? -->
<script>
// Poor men's: Table of Content / Topic list... I always wanted to do this in PowerPoint... but I did not know how to use Macros...
(async () => {
  var container = lively.query(this, "lively-container")
  if (!container || container.getURL) return
  var source = await fetch(container.getURL()).then(r => r.text())
  var topics = source.split("\n").filter(ea => ea.match(/^# Topic( \d\d)?:/)).map(ea => <li>{ea.replace(/# Topic/,"").replace(/:/,"").replace(/<.*>/,"")}</li>)

  // #Idea, instead of just printing a TOC in the view, we could materialize them as content and update the topic number? 
  // #Contra, maybe this should be very static and done by hand to use them as references....
  var ul = <ul>{...topics}</ul>
  return ul
})()
</script>


---
# Topic 01: Graph Drawing

- Domain: Visualization algorithms
- Compare:
  - Simulated Annealing
  - Force Layout
  
<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_graphlayout.png" width="60%" style="position:absolute; top:90px; right:20px;z-index:-1"></img>
<div style="height:30%"></div>

- Literature
  - [wikipedia:Graph Drawing](https://en.wikipedia.org/wiki/Graph_drawing)
  - Ron Davidson, David Harel (1996). Drawing graphs nicely using simulated annealing
  - Thomas M. J., Fruchterman  Edward M. Reingold (1991). Graph drawing by force-directed placement


---
# Topic 02: Stable Treemaps

- Domain: Visualization Algorithms
- e.g. Voronoi tree maps

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_treemaps.png" width="40%" style="position:absolute; top:290px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>


- Literature
  - see [Sebastian Hahn @ hpi](https://hpi.de/doellner/people/current/schmechel.html)
  
---
# Topic 03: Entity Component System

- Domain: Software Engineering 
- Links/Resources

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_ecs_entity.png" width="40%" style="position:absolute; top:240px; right:50px;z-index:-1"></img>
<div style="height:30%"></div>


- Literature
  - [wikipedia:Entity Component System](https://en.wikipedia.org/wiki/Entity–component–system)
  - [Nick Prühs (2014) Component-Based Entity Systems in Spielen](https://www.heise.de/developer/artikel/Component-Based-Entity-Systems-in-Spielen-2262126.html?seite=all) 
  - [Michael House (2012) What is the role of “systems” in a component-based entity architecture](https://gamedev.stackexchange.com/questions/31473/what-is-the-role-of-systems-in-a-component-based-entity-architecture)
  - [Chris Granger (2012). Anatomy of a Knockout](http://www.chris-granger.com/2012/12/11/anatomy-of-a-knockout/)

---
# Topic 04: Conflict-free replicated data type

- Domain: Software Engineering / Distributed Computing

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_distributed-computing.png" width="50%" style="position:absolute; top:190px;right:60px;z-index:-1"></img>
<div style="height:60%"></div>

- Literature
  - [wipipedia:Conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)


---
# Topic 05: Regular Expressions

- Domain: Algorithms
- Implementation Strategies
  - Deterministic Finite Automatons (DFAs)
  - Nondeterministic Finite Automatons (NFAs) 
  - Backtracking

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_regex.png" width="30%" style="position:absolute; top:190px;right:60px;z-index:-1"></img>
<div style="height:30%"></div>


- Literature
  - [wikipedia:Regular Expression](https://en.wikipedia.org/wiki/Regular_expression)



---
# Topic 06:  Parser Combinator

- Domain: Software Engineering 

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_parser_combinator.png" width="60%" style="position:absolute; top:190px;right:60px;z-index:-1"></img>
<div style="height:50%"></div>



- Literature
  - [wikipedia:Parser_combinator](https://en.wikipedia.org/wiki/Parser_combinator)

---
# Topic 07: Material Point Method

- Domain: Simulation Algorithms
- [Example](http://onsetsu.github.io/floom/example.html)

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_material_method.jpg" width="70%" style="position:absolute; top:290px;right:60px;z-index:-1"></img>
<div style="height:50%"></div>



- Literature
  - [wikipedia:Material Point Method](https://en.wikipedia.org/wiki/Material_point_method)


---
# Topic 08: Alpha-beta Pruning

- Domain: Artificial Intelligence / Search Algorithm

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_alpha_betta.png" width="60%" style="position:absolute; top:200px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>

- Literature
  - [wikipedia:Alpha-beta Pruning](https://en.wikipedia.org/wiki/Alpha–beta_pruning)
  - Knuth, D. E., and Moore, R. W. (1975). "An Analysis of Alpha-Beta Pruning”
  - [Chessprogramming Wiki / Alpha-Beta](http://chessprogramming.wikispaces.com/Alpha-Beta)

---
# Topic 09: Monte Carlo Tree Search

- Domain: Artificial Intelligence / Search Algorithm
- Example Application: Alpha Go KI 


<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_game_structure.png" width="40%" style="position:absolute; top:50px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>


- Literature
  - [wikipedia:Monte Carlo Tree Search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)
  - [Silver, David, et al. "Mastering the game of Go with deep neural networks and tree search" ](https://pdfs.semanticscholar.org/1740/eb993cc8ca81f1e46ddaadce1f917e8000b5.pdf)


---
# Topic 10: Support Vector Machine

- Domain: Artificial Intelligence

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_support_vector_machines.png" width="50%" style="position:absolute; top:220px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>

- Literature
  - [wikipedia:Support Vector Machine](https://en.wikipedia.org/wiki/Support_vector_machine)

---
# Topic 11: Artificial Neural Network

- Domain: Artificial Intelligence

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_multi-layer-neural-network.png" width="60%" style="position:absolute; top:220px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>

- Literature
  - [wikipedia:Deep Learning](https://en.wikipedia.org/wiki/Deep_learning)
  - [Michael Nielsen (2017). Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/index.html)

---
# Topic 12: Prolog / Unification

- Domain: Software Engineering / Solving / AI ...



<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_prolog.png" width="60%" style="position:absolute; top:220px; right:50px;z-index:-1"></img>
<div style="height:50%"></div>


- Literature
  - [wikipedia:Unification](https://en.wikipedia.org/wiki/Unification_(computer_science))
  - [wikipedia:Prolog](https://en.wikipedia.org/wiki/Prolog)


---
# Topic 13: Constraint Solver 

- Domain: Constraints Solving
- Compare
  - Cassowary
  - Gradient Descent
  - Back tracking

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_gradient_ascent.png" width="50%" style="position:absolute; top:120px; right:50px;z-index:-1"></img>
<div style="height:30%"></div>

- Literature
  - [wikipedia:Gradient Descent](https://en.wikipedia.org/wiki/Gradient_descent)
  - Greg J. Badros, Alan Borning, and Peter J. Stuckey (2001). The Cassowary Linear Arithmetic Constraint Solving Algorithm

---
# Topic 14: Z3

- Domain: Constraints Solving
- Theorem prover 
- Satisfiability modulo theories (SMT) 

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_smt_solver.png" width="50%" style="position:absolute; top:220px; right:50px;z-index:-1" 
   alt="image source:David Déharbe, Pascal Fontaine, Yoann Guyot, and Laurent Voisin. 2012. SMT solvers for rodin"></img>
<div style="height:40%"></div>

- Literature
  - Leonardo de Moura, Nikolaj Bjørner (2008). Z3: An efficient SMT solver
  - [github:z3](https://github.com/Z3Prover/z3)


---
# Topic 15: Learnable Programming<br> 1. Follow the flow

- Domain: Programming Experience
- [lively4 continous editor prototype](open://lively-continuous-editor)

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_learnable_programming_1.png" width="100%" style="position:absolute; top:270px; right:50px;z-index:-1"></img>
<div style="height:40%"></div>

- Literature 
  - Bret Victor 2012. Inventing on Principle.
  - Bret Victor 2012. Learnable Programming. [http://worrydream.com/](http://worrydream.com/)

---
# Topic 16: Learnable Programming <br> 2. See the state

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_learnable_programming_2.png" width="100%" style="position:absolute; top:230px; right:50px;z-index:-1"></img>
<div style="height:55%"></div>

- Literature 
  - Bret Victor 2012. Inventing on Principle.
  - Bret Victor 2012. Learnable Programming. [http://worrydream.com/](http://worrydream.com/)

---
# Topic 17: Learnable Programming <br> 3. Create by reacting


<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_learnable_programming_3.png"  width="100%" style="position:absolute; top:200px; right:50px;z-index:-1"></img>
<div style="height:55%"></div>

- Literature 
  - Bret Victor 2012. Inventing on Principle.
  - Bret Victor 2012. Learnable Programming. [http://worrydream.com/](http://worrydream.com/)


---
# Topic 18: Learnable Programming <br>4. Create by abstracting


<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_learnable_programming_4.png"   width="100%" style="position:absolute; top:200px; right:50px;z-index:-1"></img>
<div style="height:55%"></div>

- Literature 
  - Bret Victor 2012. Inventing on Principle.
  - Bret Victor 2012. Learnable Programming. [http://worrydream.com/](http://worrydream.com/)


---
# Topic 19: Blockchain

- Domain: Cryptography Algorithm

<img src="https://lively-kernel.org/lively4/lively4-jens/doc/PX2018/media/topic_blockchain.png"    width="20%" style="position:absolute; top:50px; right:50px;z-index:-1"></img>
<div style="height:55%"></div>

- Literature
  - [wikipedia:Blockchain](https://en.wikipedia.org/wiki/Blockchain)

---
# And ...

<div style="font-size: 40pt; margin-top:200px; margin-left:150px">
Propose your own topic!
</div>

---

# Form of Presentation 

- Demo / active content with text (no external slides)
- Squeak: see BookMorph etc
- Lively4: Markdown / HTML  

---

# Content of Presentation

- Present and explain problem and specific solution of the domain problem
- Use interactivity and visualizations that are supported by text 
- Present your solution on a meta level: present how you visualized made it interactive

---

# Early Feedback Presentation

- No weekly meetings, but we want to know if you are on the right track
- Solution, one very short presentation:
  - Understanding the problem / motivation?
  - Handle technical problems with both domain and presentation technogy?
  - Are on the right track?
- Max 10 mins 
  
---
# Schedule

- Project presentation (April 11th)
- Topic assignment and Tutorial(s) (April 18th) 
- Continuous consulations (in C.E)
- Early feedback presentation (10min), May 16th
- Continuous consulations (in C.E)
- Presentations (30min + discussion), 2 projects per session until July 18th

---

# Organization

- Project-Seminar, 4 SWS, 2 students per group
- Grading 
  - 6 ECTS graded credit points
  - Grade based on project and presentation
- Hand-In
  - Presentation, Screencast, Sourcecode
- Enrollment with preferred 3 topic names on or before April 16th
  - Mail to stefan.ramson@hpi.de and jens.lincke@hpi.de with PX2018 in subject
- Presentation dates determined after topics are assigned

---

<!-- #TODO pull this up into presentation? -->
<script>
// poor men's slide master
var presentation = lively.query(this, "lively-presentation")
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
""
</script>

