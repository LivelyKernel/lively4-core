import Morph from "./Morph.js"

import d3 from 'src/external/d3.v4.js';

import loadDropbox from 'src/client/triples/triples.js';

//const MIN_MAGNIFICATION = 0.01;
//const MAX_MAGNIFICATION = 4;

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
    
    var width,height;
    var chartWidth, chartHeight;
    var margin;
    var svg = d3.select(this.get('#graph'))
      .append("svg");
    var chartLayer = svg;//.append("g").classed("chartLayer", true);

    main.call(this);
			
    function getGraph() {
      let king1 = { label: 'Arthur' };
      let king2 = { label: 'Bob' };
      let king3 = { label: 'Ceasar' };
      let successor = { label: 'successor' };
      let successor2 = { label: 'successor2' };
      let successor3 = { label: 'successor3' };
      let since = { label: 'since' };
      let t1 = { isTriple: true, s: king2, p: successor, o: king1}
      let t2 = { isTriple: true, s: king3, p: successor, o: king2}
      let t3 = { isTriple: true, s: king3, p: successor2, o: king2}
      let t4 = { isTriple: true, s: king3, p: successor3, o: king2}
      return [
        king1, king2, king3, successor, since, t1, t2, t3, t4
      ];
    }
    
    async function main() {
        let //knots = await loadDropbox("https://lively4/dropbox/");
        
        knots = getGraph();
        let nodes = knots.map(knot => knot );
        let links = [];
        knots
          .filter(knot => knot.isTriple)
          .forEach(triple => {
            links.push({
              source: triple.s,
              target: triple
            });
            links.push({
              source: triple,
              target: triple.o
            });
          });
          //:d3.range(0, range).map(function(){ return {source:~~d3.randomUniform(range)(), target:~~d3.randomUniform(range)()} })
        var data = {
            nodes,
            links        
        }
        
        setSize.call(this, data);
        drawChart(data);
    }
    
    function setSize(data) {
        width = this.get("#graph").clientWidth;
        height = this.get("#graph").clientHeight;
        margin = {top:0, left:0, bottom:0, right:0 };
        
        
        chartWidth = width - (margin.left+margin.right)
        chartHeight = height - (margin.top+margin.bottom)
        
        //chartLayer.attr("width", width).attr("height", height)
        
        chartLayer
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            //.call(zoom)
            .attr("transform", "translate("+[margin.left, margin.top]+")")
    }
    
    function drawChart(data) {
        
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.index))
            .force("collide",d3.forceCollide(d => d.r + 8).iterations(16) )
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(chartWidth / 2, chartWidth / 2))
            .force("y", d3.forceY(0))
            .force("x", d3.forceX(0))
    
        let linkContainer = chartLayer.append("g").classed("linkContainer", true);
        var link = linkContainer.selectAll("line")
            .data(data.links).enter()
            .append("line")
            .attr("stroke", "black")
        
        let nodeContainer = chartLayer.append("g").classed("nodeContainer", true);
        let node = nodeContainer.selectAll(".node")
          .data(data.nodes).enter()
          .append("g")
          .attr("class", "node")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        node.append("circle")
          .attr("r", d => 10); // d.r

        node.append("text")
          .attr("dx", 12)
          .attr("dy", ".35em")
          .text(d => d.label || d.p && 'TRIPLE' + d.p.label);

        function recalculatePositions() {
            node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

            link
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