import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import annealing from "doc/PX2018/project_6/annealing.js";

var lastId = 0;
var lastNode 

export default class LivelyPx18SimulatedAnnealing extends Morph {
  async initialize() {   
    this.updateViz();
  }
  
  updateViz() {
    var bounds = this.getBoundingClientRect();
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g");
    
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var node = svg.append("g")
      .selectAll(".node");

    var link = svg.append("g")
      .selectAll(".link")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("stroke", "lightgray");
    
    var startButton = this.get("#startAnneal");
    startButton.addEventListener("click", startAnnealing);

    var a = {id: "a", group: 1, x: 0, y: 0, r: 10},
        b = {id: "b", group: 2, x: 0, y: 0, r: 10},
        c = {id: "c", group: 3, x: 0, y: 0, r: 10},
        d = {id: "d", group: 4, x: 0, y: 0, r: 10},
        nodes = [a, b, c, d],
        links = [{source: a, target: b},{source: b, target: c},
                 {source: c, target: a}, {source: a, target: d},
                 {source: b, target: d}, {source: c, target: d} ];

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
    }
    
    async function updatePositions() {
      node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    }
    
    async function startAnnealing() {
      annealing()
        .width(width)
        .height(height)
        .nodes(nodes)
        .links(links)
        .updateFunction(updatePositions)
        .timeout(0)
        .start(1000);
    }

    start();
  }
  
}
