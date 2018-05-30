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

# Simulated Annealing - Demo

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

import d3 from "src/external/d3.v4.js";
import annealing from "doc/PX2018/project_6/annealing.js";
(async () => {


var nodeId = 3;
var svg = d3.select(lively.query(this, "#svgContainer"));
var color = d3.scaleOrdinal(d3.schemeCategory20);
var width = +svg.attr("width"),
  height = +svg.attr("height");
  
var node = svg.append("g")
  .selectAll(".node");
  
var link = svg.append("g")
  .selectAll(".link")
  .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
  .attr("stroke", "lightgray");

var a = {id: "a", group: 1, x: 0, y: 0, r: 10},
    b = {id: "b", group: 2, x: 0, y: 0, r: 10},
    c = {id: "c", group: 3, x: 0, y: 0, r: 10},
    d = {id: "d", group: 4, x: 0, y: 0, r: 10},
    nodes = [a, b, c, d],
    links = [{source: a, target: b},{source: b, target: c}, {source: c, target: a}, {source: a, target: d}, {source: b, target: d}, {source: c, target: d} ];

  

async function start() {
  node = node.data(nodes, function(d) { return d.id;});
  node.exit().remove();
  node = node.enter().append("circle")
    .attr("r", 10)
    .attr("fill", function(d) { return color(d.id); })
    .merge(node);

  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("stroke", "lightgray")
    .merge(link);

  node.append("title")
    .text(function(d) { return d.id; });
    
  annealing()
    .nodes(nodes)
    .links(links)
    .start(10000);
  node
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });
};

start();


})();


</script>


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