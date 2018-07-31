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
  }
  
  p {
    font-size: 18pt
  }
  @media print {
    .lively-slide {
      page-break-before: always;
      border: 0px solid white;
    }      
  }
  
  .codespan {
    color: #05a;
  }
  
  .codespan-red {
    color: #a11;
  }
  
  .centralized {
    text-align: center;
    margin-top: 25%;
  }
  
  .block-div {
    font-size: 18pt;
    margin-top: 6px;
    line-height: 115%;
    padding: 3px;
    display: block;
  }
  
  .source {
    font-size: 10px;
    display:block;
  }
  
  h2 {
    font-size: 20pt;
  }
  
  #accept-annealing {
    font-size: 120%;
    padding: 15px;
    border: solid 1px gray;
    text-align: center;
    background-color: rgba(102, 127, 153, 0.1);
    border-radius: 15px;
  }
  
  #energy-code {
    display: inline-block;
    font-size: 120%;
    padding: 25px;
    border: solid 1px gray;
    background-color: rgba(102, 127, 153, 0.1);
    border-radius: 15px;
  }
  
  #arrow {
    margin-top: 10%;
    font-size: 50pt;
    color: grey;
  }
  
  #arrow2 {
    font-size: 50pt;
    color: grey;
    padding: 20px;
  }
  
</style>

<div class="title">
  PX 2018: Graph Drawing
</div>

<div class="authors">
  Siegfried Horschig, Theresa Zobel
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

# Motivation

<div>
<ul>
  <li>
    Traditional and powerful tools that visually represent sets of data and the relations
among them
  </li>
  <li>
    Concept of graphs can be traced back to Ancient Egypt - Game Morris
  </li>
  <li>
    First scientific purposes 1736: Euler published his famous Königsberg paper ("drawing") 
  </li>
  <li>
  Very first abstract graph drawing appeared in Ball’s book on mathematical recreations 1892
  </li>
</ul>
<img src="./img/morris_game.jpg" style="width:250px; margin-left: 20px; margin-right: 50px;">
<img src="./img/Koenigsberg-Eulers-drawing.jpg" style="width:300px;margin-right: 50px;">
<img src="./img/balls_drawing.png">
</div>
<li class="source">sources:</li>
<li class="source"> http://stewartmath.com/dp_fops_samples/fops6.html</li>
<li class="source">https://www.researchgate.net/figure/The-Seven-Bridges-of-Koenigsberg-problem-a-Eulers-drawing-31-b-Balls-abstract_fig1_325794369</li>
<li class="source">http://www.instructables.com/id/Nine-Mens-Morris/</li>

--- 

# Key Challenges

<div>
<ul>
  <li>
  <b>Algorithm complexity: </b> graph size is crucial to algorithms
  </li>
  <li>
    <b>Display clutter: </b> when size of data grows, the corresponding graph becomes cluttered and visually confusing
  </li>
  <li>
    <b>Navigation: </b> navigating large information spaces on small displays
  </li>
  <li>
  <b>&rarr; Readability</b>
  </li>
</ul>
<img src="./img/standard-layout-1.gif" style="width:650px;">
</div>




--- 

# Key Requirements

<div>
<div class="block-div">
Improving readability through:
</div>
<ul>
  <li>Low number of crossing</li>
  <li>Small bounding box of graph</li>
  <li>Short edges</li>
</ul>

<div class="row" style="display: flex;">
  <img src="./img/graph_drawing2.png" style="width:350px; height:100%; margin-top: 50px;">
  <div id="arrow2">&rarr;</div>
  <img src="./img/graph_drawing1.png" style="width:150px; height: 100%;">
</div>
</div>


--- 

# Layout Methods

<div>
<ul>
  <li>Arc Layout: vertices of a graph are placed along a line & minimizes the number of crossings.</li>
  <li>Circle Layout: places the vertices of a graph on a circle (network topologies)</li>
  <li><b>Force-directed Layout</b></li>
  <li><b>Energy-minimizing simulations (Simulated Annealing)</b></li>
</ul>
<br>
<img style="max-height: 150px; margin-right: 20px; margin-left: 40px;" src="./img/arc_diagram.png">
<img style="max-height: 150px" src="./img/Barabasi_Albert_model.gif">
<img style="max-height: 200px; margin-bottom: -50px;" src="./img/forcegraph.gif">
<img style="max-height: 100px; margin-left: 40px;" src="./img/Hill_Climbing_with_Simulated_Annealing.gif">
</div>
<div>
<ul>

</ul>
<br>

</div>


<div> 
<li class="source">source</li>
<li class="source">commons.wikimedia.org </li>
</div>

--- 

<h1 class="centralized">Force-directed Graphs</h1>

--- 

# General

<div>
  <div class="block-div">
  Position the nodes of a graph in two-dimensional so that:
  </div>
  <ul>
    <li>
    all the edges are of more or less equal length
    </li>
    <li>
    few crossing edges
    </li>
    <li>
    by assigning forces among the set of edges and the set of nodes and using these forces to simulate the motion of the edges and nodes
    </li>
  </ul>
</div>
</br>
<div>
<div class="block-div">First Pioneers:</div>
  <ul>
    <li>
       Eades 1984: Combination of attractive forces on adjacent vertices, and repulsive forces on all vertices
    </li>
    <li>
    Fruchterman & Reingold 1991
    </li>
  </ul>
</div>
</br>
<img style="max-height: 300px" src="./img/forcegraph.gif">




--- 


# Algorithm

<div>
<div class="block-div">
<b>Dwyer's Implementation: </b>
</div>
<ul>
  <li>
   Much faster and scalable to much larger force-directed graphs: O(nlogn+m+c) </li>
   <li> Providing users with interactive control
over the layout
  </li>
  <li>
  Allowing users to achieve layout customized for their specific
  application or diagram.
  </li>
  <li>Implements three primary forces upon the nodes</li>
</ul>
</div>

<div>
<li class="source">source:</li>
<li class="source">http://vis.stanford.edu/files/2011-D3-InfoVis.pdf</li>
<li class="source">http://users.monash.edu/~tdwyer/Dwyer2009FastConstraints.pdf</li>
</div>


--- 

# Demo

<lively-px18-force-layout ></lively-px18-force-layout>

--- 

# Evaluation

<div>
<h2>
Advantages:
</h2>
<ul>
<li>Good quality</li>
<li>Readability</li>
<li>Interactivity</li>
<li>Simplicity</li>
<li>Bounding Boxed</li>
</ul>
</div>

<div>
<h2>
Disadvantages:
</h2>
<ul>
<li>Can lead to jittering</li>
<li>Possible high running time </li>
<li>Not very stable</li>
</ul>
</div>

---

<h1 class="centralized">Simulated Annealing</h1>

---

# Simulated Annealing

<img style="max-height: 500px" src="./img/annealing.jpg"/>
<p style="font-size: 8pt;
    position: absolute;
    bottom: 0;
    width: 100%;"> Source: homesteading.com
</p>

---

# General

* Attempts to find global optimum

* Energy function to determine fitness of solutions

* "Annealing" Principle:
  * Initial high "Temperature" value, decreasing with time
  * Alters solution (switches to neighbouring solution) if:
    * Neighbouring solution has a lower energy or
    * Neighbouring solution has a higher energy and the temperature is high
    
<img style="max-height: 100px; margin-left: 100px;" src="./img/Hill_Climbing_with_Simulated_Annealing.gif"/>

---

# Implementation

* Inspired by d3-labeler

* Definition of "neighbouring solution" per iteration:
  * Movement of all nodes?
    * Takes longer, but may lead to faster convergence
  * Movement of one node?
    * May need more iterations for good result
    * Better for demonstration purposes

---

#  Implementation

<div class="row" style="display: flex;">
  <img style="max-height: 300px;" src="./img/graph_example_1.jpg"/> 
  <div id="arrow">&rarr;</div>
  <img style="max-height: 300px;" src="./img/graph_example_2.jpg"/>
</div>

### Accept if:
<div id="accept-annealing">
<span class="codespan">Energy</span>(new) < <span class="codespan">Energy</span>(old) 
<br>
<br>
<b>or</b>
<br>
<br>
Math.random() >= Math.exp(<span class="codespan">-delta_energy</span> / <span class="codespan">currentTemperature</span>)
</div>

---

#  Energy Function (Example)

<div id="energy-code">
  <img src="./img/energy_code_cropped_1.jpg"/> 
</div>

---

#  Energy Function (Example)

<div id="energy-code">
  <img src="./img/energy_code_cropped_2.jpg"/> 
</div>

---

#  Energy Function (Example)

<div id="energy-code">
  <img src="./img/energy_code.jpg"/> 
</div>

---

# Demo

<div>
  <lively-px18-simulated-annealing ></lively-px18-simulated-annealing>
</div>

--- 


# Evaluation

### Advantages:

+ Can stop after any amount of iterations 
+ Custom criteria are easy to implement and extend

### Disadvantages:

- High runtime (O(n<sup>4</sup>))
- Less applicable for larger graphs

--- 

<h1 class="centralized">Force-Layout Graph vs Simulated Annealing</h1>

---

# Demo

<div>
  <lively-px18-graph-drawing ></lively-px18-graph-drawing>
</div>

--- 

# Conclusion

* Simulated Annealing easily customizable, but less applicable for large graphs

* Force layout provides widely applicable, reasonably fast and interactive solution

<img style="max-height: 300px; margin-left:100px;" src="./img/thankyougraph.png"/>

---

# References

* Cui, Weiwei, and Huamin Qu. "A survey on graph visualization." PhD Qualifying Exam (PQE) Report, Computer Science Department, Hong Kong University of Science and Technology, Kowloon, Hong Kong (2007).
* Bostock, Michael, Vadim Ogievetsky, and Jeffrey Heer. "D³ data-driven documents." IEEE Transactions on Visualization & Computer Graphics 12 (2011): 2301-2309.
* Dwyer, Tim. "Scalable, versatile and simple constrained graph layout." Computer Graphics Forum. Vol. 28. No. 3. Oxford, UK: Blackwell Publishing Ltd, 2009.
* Gibson, Helen, Joe Faith, and Paul Vickers. "A survey of two-dimensional graph layout techniques for information visualisation." Information visualization 12.3-4 (2013): 324-357.
* Hadany, Ronny, and David Harel. "A multi-scale algorithm for drawing graphs nicely." International Workshop on Graph-Theoretic Concepts in Computer Science. Springer, Berlin, Heidelberg, 1999.


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