import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

var lastId = 0;
var lastNode 

export default class LivelyD3Tree extends Morph {
  async initialize() {   
    this.updateViz()
    
    // window.d3 = d3
    // System.import("src/client/container-scoped-d3.js")
  }
  
  updateViz() {
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    
    var addButton = this.get("#addNode");
    var removeButton = this.get("#removeNode");
    addButton.addEventListener("click", addNode);
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

    var nodes = [],
        links = [];

    function addNode() {
      var newNode = {id: "" + (lastId++), group: 1}
      nodes.push(newNode);
      if (lastNode !== 'undefined') {
        links.push(
          {source: lastNode, target: newNode});        
      }
      lastNode = newNode;
      restart();
    }

    function removeNode() {
      nodes.shift(); // Remove first node
      links.shift(); // Remove first link
      if(nodes.length == 0) {
        lastId = 0;
        lastNode = 'undefined';
      }
      restart();
    }

    async function start() {
      lastId = 0;
      lastNode = 'undefined';
    }
    
    function restart() {
      node = node.data(nodes, function(d) { return d.id;});
      node.exit().remove();
      node = node.enter().append("circle")
        .attr("r", 10)
        .attr("fill", function(d) { return color(d.group); })
        .merge(node)
        .call(d3.drag()
          .on("start", dragstarted.bind(this, simulation))
          .on("drag", dragged.bind(this, simulation))
          .on("end", dragended.bind(this, simulation)));
      
      
      link = link.data(links, function(d) { return d.source.id + "-" + d.target.id;         });
      link.exit().remove();
      link = link.enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
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
      
       simulation
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1);
      
      ticked(link, node);

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
  }
  
}
