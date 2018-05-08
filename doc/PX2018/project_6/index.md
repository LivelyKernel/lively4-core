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

# Abstract

<img src="./img/standard-layout-1.gif">

---

# Demo

<div>
<svg width="900" height="500" id="svgContainer" style="border-style: solid"></svg>
</div>
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

.link {
  stroke: #999;
}

</style>

<script>
import d3 from "src/external/d3.v5.js"

var addNewButton = document.createElement("button")
  addNewButton.textContent = "Add"
  addNewButton.onclick = async () => {
   addNode();
  }
  button.style = "position: absolute; bottom: 10px; left: 10px"
  button

var nodeId = 3;

var graphJson = {
        "nodes": [
          {"id": 1, "group": 1},
          {"id": 2, "group": 2},
          {"id": 3, "group": 3}        
        ],
        "links": [
          {"source": 1, "target": 2, "value": 1},
          {"source": 1, "target": 3, "value": 2}
        ]
      }

function getGraphJSON() {
    return graphJson;
  }
  
function addNode() {
  nodeId++;
  var newNode = {"id": nodeId, "group": nodeId};
  var newLink = {"source": 1, "target": newNode, "value": 2};
  console.log(nodeId);
  // graphJson.nodes.append(newNode);
  // graphJson.links.append(newLink);
}
  
  

(async restart => {

  console.log('restart');

  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var svg = d3.select(lively.query(this, "#svgContainer")),
      graph = getGraphJSON(),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 10)
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted.bind(this, simulation))
          .on("drag", dragged.bind(this, simulation))
          .on("end", dragended.bind(this, simulation)));

  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("stroke", "lightgray");

  node.append("title")
    .text(function(d) { return d.id; });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked.bind(this, link, node));

  simulation.force("link")
    .links(graph.links)
    .distance(100);

})();

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
</script>
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