import Morph from "./Morph.js"

import d3 from 'src/external/d3.v4.js';

import loadDropbox from 'src/client/triples/triples.js';
import * as drawTools from 'src/client/triples/drawTools.js';

const MIN_MAGNIFICATION = 0.01;
const MAX_MAGNIFICATION = 4;

class Node {
  constructor(label) {
    this._label = label
    this.r = ~~d3.randomUniform(8, 28)();
  }
  label() {
    return this._label;
  }
}
class Link {}

export default class TripleNotes extends Morph {

  initialize() {
    this.windowTitle = "Triple Notes";
    
    let parentElement = this.get('#graph');
    var width,height;
    var chartWidth, chartHeight;
    var margin;
    var svg = d3.select(parentElement)
      .append("svg");
    var graphContainer = svg.append("g").classed("graphContainer", true);

    setSize();
    main.call(this);
			
    function getNodes(graph) {
      return graph.knots;
    }
    
    async function main() {
        let graph = await loadDropbox("https://lively4/dropbox/");
        
        let knots = getNodes(graph);
        let nodes = knots.map(knot => knot );
        let links = [];

        nodes.forEach(n => n.draw = function (parentElement, additionalCssClasses) {
    			var cssClasses = [];// that.collectCssClasses();
    
    			//that.nodeElement(parentElement);
    
    			//if (additionalCssClasses instanceof Array) {
    			//	cssClasses = cssClasses.concat(additionalCssClasses);
    			//}

    			drawTools.appendCircularClass(parentElement, 40, cssClasses, n.label(), 'lightblue');
    
    			//that.postDrawActions(parentElement);
    		});

        knots
          .filter(knot => knot.isTriple())
          .filter(triple => triple.subject)
          .forEach(triple => {
            links.push({
              source: triple.subject,
              target: triple
            });
            links.push({
              source: triple.object,
              target: triple
            });
          });

        var data = {
            nodes,
            links        
        }
        
        drawChart(data);
    }
    
    lively.addEventListener("triple-notes", this, "extent-changed", e => { setSize(); });

    function setSize() {
        width = parentElement.clientWidth;
        height = parentElement.clientHeight;
        //console.log(`%cwidth: ${width} height: ${height}`, 'font-size: 20pt')

        margin = {top:0, left:0, bottom:0, right:0 };

        chartWidth = width - (margin.left+margin.right)
        chartHeight = height - (margin.top+margin.bottom)

        //graphContainer.attr("width", width).attr("height", height)

        svg
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("transform", "translate("+[margin.left, margin.top]+")");
    }

    function zoomed() {
      graphContainer.attr("transform", d3.event.transform);
    }
    let zoom = d3.zoom()
			.duration(150)
	    	.scaleExtent([MIN_MAGNIFICATION, MAX_MAGNIFICATION])
      .on("zoom", zoomed);
    svg.call(zoom);
    
    function drawChart(data) {
        
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.index).distance(200))
            //.force("collide",d3.forceCollide(d => d.r + 8).iterations(16) )
            .force("charge", d3.forceManyBody().strength(node => node.isTriple() ? -190*0.5 : -190))
            .force("center", d3.forceCenter(chartWidth / 2, chartWidth / 2))
            .force("y", d3.forceY(0).strength(0.001))
            .force("x", d3.forceX(0).strength(0.001))

        let linkContainer = graphContainer.append("g").classed("linkContainer", true);
        var hiddenLinkElements = linkContainer.selectAll("line")
            .data(data.links).enter()
            .append("line")
            .attr("stroke", "black")
        
        let nodeContainer = graphContainer.append("g").classed("nodeContainer", true);
        let nodeElements = nodeContainer.selectAll(".node")
          .data(data.nodes).enter()
          .append("g")
          .attr("class", "node")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        nodeElements.each(function (node) {
			node.draw(d3.select(this));
});

        nodeElements.append("text")
          .attr("class", "text")
          .style("text-anchor", "middle")
          .text(d => d.label());

        function recalculatePositions() {
            nodeElements.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

            hiddenLinkElements
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        }  
        
        simulation
            .nodes(data.nodes)
            .on("tick", recalculatePositions);
    
        simulation.force("link")
            .links(data.links);    
        
        function dragstarted(d) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        
        function dragged(d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }
        
        function dragended(d) {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
        
    }
  }
}