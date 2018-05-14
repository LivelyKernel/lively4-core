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

<div class="title">
  PX 2018: Graph Drawing
</div>

<div class="authors">
  Theresa Zobel, Siegfried Horschig
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

# Problem

<img src="./img/standard-layout-1.gif">

--- 

# Graph Drawing - Key Challenges


* Low number of crossings

* Small area

* Short edges

<img src="./img/Graph_drawing.jpg">

--- 

# Layout Methods


* Arc Layout

<img style="max-height: 100px" src="./img/arc_diagram.png">

* Circle Layout

<img style="max-height: 100px" src="./img/Barabasi_Albert_model.gif">

* Force-directed Layouts

* Energy-minimizing simulations (Simulated Annealing)


<span style="font-size: 8pt;
    position: fixed;
    bottom: 0;
    width: 100%;"> source: commons.wikimedia.org</span>

--- 

# Force-directed Layouts - Demo

<div>
<svg width="900" height="500" id="svgContainer" style="border-style: solid"></svg>
</div>
<button id="addNode">Add Node</button>
<button id="removeNode">Remove Node</button>
<style>

rect {
  fill: none;
  pointer-events: all;
}

.node {
  fill: #000;
}

.cursor {
  fill: none;
  stroke: brown;
  pointer-events: none;
}

</style>

<script>
import d3 from "src/external/d3.v4.js"

var nodeId = 3;
var svg = d3.select(lively.query(this, "#svgContainer"));
var color = d3.scaleOrdinal(d3.schemeCategory20);
var width = +svg.attr("width"),
  height = +svg.attr("height");
  
var addButton = lively.query(this, "#addNode")
addButton.addEventListener("click", addNode);
var removeButton = lively.query(this, "#removeNode")
removeButton.addEventListener("click", removeNode);

var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .alphaTarget(1);
  
var node = svg.append("g")
  .selectAll(".node");
  
var link = svg.append("g")
  .selectAll(".link")
  .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
  .attr("stroke", "lightgray");

var a = {id: "a", group: 1},
    b = {id: "b", group: 2},
    c = {id: "c", group: 3},
    nodes = [a, b, c],
    links = [{source: a, target: b},{source: b, target: c}, {source: c, target: a} ];
    
function addNode() {
  nodes.push(c); // Re-add c.
  //links.push({source: b, target: c}); // Re-add b-c.
  links.push({source: c, target: a}); // Re-add c-a.
  restart();
}

function removeNode() {
  nodes.pop(); // Remove c.
  links.pop(); // Remove c-a.
  links.pop(); // Remove b-c.
  restart();
}

  

async function start() {
  node = node.data(nodes, function(d) { return d.id;});
  node.exit().remove();
  node = node.enter().append("circle")
    .attr("r", 10)
    .attr("fill", function(d) { return color(d.id); })
    .merge(node)
    .call(d3.drag()
      .on("start", dragstarted.bind(this, simulation))
      .on("drag", dragged.bind(this, simulation))
      .on("end", dragended.bind(this, simulation)));

  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().transition()
    .attr("stroke-opacity", 0)
    .attrTween("x1", function(d) { return function() { return d.source.x; }; })
    .attrTween("x2", function(d) { return function() { return d.target.x; }; })
    .attrTween("y1", function(d) { return function() { return d.source.y; }; })
    .attrTween("y2", function(d) { return function() { return d.target.y; }; })
    .remove();
  link = link.enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .call(function(link) { link.transition().attr("stroke-opacity", 1); })
    .attr("stroke", "lightgray")
    .merge(link);

  node.append("title")
    .text(function(d) { return d.id; });

  simulation
    .nodes(nodes)
    .on("tick", ticked.bind(this, link, node));

  simulation.force("link")
    .links(links)
    .distance(100);

};

function restart() {
  node = node.data(nodes, function(d) { return d.id;});
  node.exit().transition()
      .attr("r", 0)
      .remove();
  node = node.enter().append("circle")
    .attr("fill", function(d) { return color(d.id); })
    .call(function(node) { node.transition().attr("r", 8); })
    .merge(node);

  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().transition()
    .attr("stroke-opacity", 0)
    .attrTween("x1", function(d) { return function() { return d.source.x; }; })
    .attrTween("x2", function(d) { return function() { return d.target.x; }; })
    .attrTween("y1", function(d) { return function() { return d.source.y; }; })
    .attrTween("y2", function(d) { return function() { return d.target.y; }; })
    .remove();
  link = link.enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .call(function(link) { link.transition().attr("stroke-opacity", 1); })
    .attr("stroke", "lightgray")
    .merge(link);

  node.append("title")
    .text(function(d) { return d.id; });

  simulation.nodes(nodes);

  simulation.force("link").links(links).distance(100);
    
  simulation.alpha(1).restart();
}

function ticked(link, node) {
  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  node
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
}
  
function dragstarted(simulation, d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(simulation, d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(simulation, d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

start();

</script>

--- 

# Force-directed Layouts - Evaluation

### Advantages:

* Good quality

* Flexible

* Interactive

### Disadvantages:

* Can lead to jittering

* Poor local minima

---

# Simulated Annealing

* Attempts to find global optimum

* Energy function to determine fitness of solutions

* "Annealing" Principle:
  * Initial high "Temperature" value, decreasing with time
  * Alters solution (switches to neighbouring solution) if:
    * Neighbouring solution has a lower energy or
    * Neighbouring solution has a higher energy and the temperature is high
    
<img style="max-height: 100px" src="./img/Hill_Climbing_with_Simulated_Annealing.gif">

---

# TODOs

* Demo for simulated annealing

* Extend force-directed approach from d3.js with simulated annealing


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