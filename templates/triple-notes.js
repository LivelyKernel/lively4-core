import Morph from "./Morph.js"

import d3 from 'src/external/d3.v4.js';

import { Graph } from 'src/client/triples/triples.js';
import * as drawTools from 'src/client/triples/drawTools.js';
import * as math from 'src/client/triples/math.js';

const MIN_MAGNIFICATION = 0.01;
const MAX_MAGNIFICATION = 4;

const NODE_BY_KNOT = new Map();
function getNodeByKnot(knot) {
  if(!NODE_BY_KNOT.has(knot)) {
    NODE_BY_KNOT.set(knot, new Node(knot));
  }
  return NODE_BY_KNOT.get(knot);
}

class RectangleTools {
  static distanceToBorder(rect, dx, dy) {
  	var width = rect.width(),
  		height = rect.height();
  
  	var innerDistance,
  		m_link = Math.abs(dy / dx),
  		m_rect = height / width;
  
  	if (m_link <= m_rect) {
  		var timesX = dx / (width / 2),
  			rectY = dy / timesX;
  		innerDistance = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(rectY, 2));
  	} else {
  		var timesY = dy / (height / 2),
  			rectX = dx / timesY;
  		innerDistance = Math.sqrt(Math.pow(height / 2, 2) + Math.pow(rectX, 2));
  	}
  
  	return innerDistance;
  };
}

const cssClassesByFileType = {
  'png': ['image'],
  'PNG': ['image'],
  'jpg': ['image'],
  'svg': ['image'],
  'mp3': ['audio'],
  'mov': ['movie'],
  'mp4': ['movie'],
  'avi': ['movie'],
  'md': ['markdown'],
  'html': ['html'],
}
class Node {
  static getCSSClassesByType(node) {
    
  }
  constructor(knot, label) {
    this.knot = knot;
    //this.r = ~~d3.randomUniform(8, 28)();
    this._radius = this.knot.content && this.knot.content.split ?
	    Math.min(this.knot.content.split(/\r?\n/).length, 100) :
	    40;
	 this._width = 60;
	 this._height = 20;
  }
  label() {
    return this.knot.label();
  }
  isTriple() {
    return this.knot.isTriple();
  }
  getKnot() { return this.knot; }
  
  draw(parentElement, additionalCssClasses) {
    const fileEnding = this.knot.url.split('#').shift().split('?').shift().split('.').pop();
    //lively.notify(fileEnding)
		var cssClasses = cssClassesByFileType[fileEnding] ?
		  cssClassesByFileType[fileEnding] :
		  (lively.notify(fileEnding), ['white']);
		
	  // that.collectCssClasses();

		//that.nodeElement(parentElement);

		//if (additionalCssClasses instanceof Array) {
		//	cssClasses = cssClasses.concat(additionalCssClasses);
		//}

    if(this.knot.isTriple()) {
      drawTools.appendRectangularClass(parentElement, 60, 20, cssClasses, this.label());
    } else {
		  drawTools.appendCircularClass(parentElement, this.actualRadius(), cssClasses, this.label());
    }

		//that.postDrawActions(parentElement);
	}
	
	actualRadius() {
	  return this._radius;
	}
	width() { return this._width; }
	height() { return this._height; }
	distanceToBorder(dx, dy) { return this.isTriple() ?
	  RectangleTools.distanceToBorder(this, dx, dy) :
	  this.actualRadius();
	}
}

class Link extends Node {
  constructor(node) {
    super(node.getKnot());
    
    this._subject = getNodeByKnot(this.getKnot().subject);
    this._predicate = getNodeByKnot(this.getKnot().predicate);
    this._object = getNodeByKnot(this.getKnot().object);
    this._triple = getNodeByKnot(this.getKnot());

    this.frontPart = new LinkPart({
      source: this._subject,
      target: this._triple
    });
    this.backPart = new LinkPart({
      source: this._triple,
      target: this._object
    });
  }
  get subject() { return this._subject; }
  get predicate() { return this._predicate; }
  get object() { return this._object; }
  get triple() { return this._triple; }
  
  //TODO: support loops specially
  isLoop() {
    return this.subject === this.object;
  }
  linkParts() {
    return [this.frontPart, this.backPart];
  }
  
  draw(linkGroup, markerContainer) {
  	linkGroup.append("path")
  		//.classed("link-path", true)
  		//.classed(this.domain().cssClassOfNode(), true)
  		//.classed(this.range().cssClassOfNode(), true)
      //.classed(property.linkType(), true);
  }
  
  // TODO: if we are self-referencial: compute the number of self references from the graph
  loops() {
    return 3;
  }
}

class LinkPart {
  constructor({ source, target }) {
    this.source = source;
    this.target = target;
  }
}

export default class TripleNotes extends Morph {

  async initialize() {
    this.windowTitle = "Knot Explorer";
    
    let parentElement = this.get('#graph');
    var width,height;
    var chartWidth, chartHeight;
    var margin;
    var svg = d3.select(parentElement)
      .append("svg");
    var graphContainer = svg.append("g").classed("graphContainer", true);

    setSize();

    let graph = await Graph.getInstance();
    
    let knots = graph.knots;
    this.updateStatistics(knots);
    
    let nodes = knots.map(getNodeByKnot);
    let links = nodes
      .filter(node => node.isTriple())
      .map(node => new Link(node));
    
    let hiddenLinks = [];
		links.forEach(link => hiddenLinks = hiddenLinks.concat(link.linkParts()));

    drawChart({
      nodes,
      links,
      hiddenLinks
    });

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
    
    svg.call(d3.zoom()
			.duration(150)
    	.scaleExtent([MIN_MAGNIFICATION, MAX_MAGNIFICATION])
      .on("zoom", zoomed));
    
    function drawChart({ nodes, links, hiddenLinks }) {
        
      var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.index).distance(200))
        //.force("collide",d3.forceCollide(d => d.r + 8).iterations(16) )
        .force("charge", d3.forceManyBody().strength(node => node.isTriple() ? -190*0.5 : -190))
        .force("center", d3.forceCenter(chartWidth / 2, chartWidth / 2))
        .force("y", d3.forceY(0).strength(0.001))
        .force("x", d3.forceX(0).strength(0.001));

      let linkPartContainer = graphContainer.append("g").classed("linkPartContainer", true);
      var hiddenLinkElements = linkPartContainer.selectAll("line")
        .data(hiddenLinks).enter()
        .append("line")
        .style("stroke", "black")
        .style("stroke-opacity", 0.3)
        .style("stroke-width", 10);
      
      let nodeContainer = graphContainer.append("g").classed("nodeContainer", true);
      let nodeElements = nodeContainer.selectAll(".node")
        .data(nodes).enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
          .on("dblclick", async node => { 
            d3.event.stopPropagation();

            let knotView = await lively.openComponentInWindow("knot-view");
            knotView.loadKnotForURL(node.getKnot().url);
          });

      nodeElements.each(function (node) {
  			node.draw(d3.select(this));
      });

      nodeElements.append("text")
        .attr("class", "text")
        .style("text-anchor", "middle")
        .style("alignment-baseline", "middle")
        .text(d => d.label());

      let linkContainer = graphContainer.append("g").classed("linkContainer", true);
      let markerContainer = linkContainer.append("defs");
      createPropertyMarker(markerContainer);
      function createPropertyMarker(markerContainer) {
      	var marker = appendBasicMarker(markerContainer);
      	//marker.attr("refX", 12);
          var m1X = -12 ;
          var m1Y = 8 ;
          var m2X = -12;
          var m2Y = -8 ;
      	marker.append("path")
      		//.attr("d", "M0,-8L12,0L0,8Z")
              .attr("d", "M0,0L " + m1X + "," + m1Y + "L" + m2X + "," + m2Y + "L" + 0 + "," + 0 )
      		.classed("basic-triple-link", true);
      }
      
      function appendBasicMarker(markerContainer) {
      	return markerContainer.append("marker")
      		.datum({})
      		.attr("id", "triple-notes-basic-triple-link")
      
      		.attr("viewBox", "-14 -10 28 20")
      		.attr("markerWidth",10)
      		.attr("markerHeight", 10)
      		//.attr("markerUnits", "userSpaceOnUse")
      		.attr("orient", "auto");
      }
      
  		// Draw links
  		let linkGroups = linkContainer.selectAll(".link")
  			.data(links).enter()
  			.append("g")
  			.classed("link", true);
  
  		linkGroups.each(function (link) {
  		  d3.select(this).attr("marker-end", "url(#triple-notes-basic-triple-link)");
  			link.draw(d3.select(this), markerContainer);
  		});
  
  		// Select the path for direct access to receive a better performance
      let linkPathElements = linkGroups.selectAll("path");
      
      let curveFunction = d3.line()
  			.x(function (d) {
  				return d.x;
  			})
  			.y(function (d) {
  				return d.y;
  			})
        .curve(d3.curveNatural);
      function recalculatePositions() {
        nodeElements.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

        hiddenLinkElements
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

    		// Set link paths and calculate additional information
    		linkPathElements.attr("d", function (link) {
    			if (link.isLoop()) {
    				return math.calculateLoopPath(link);
    			}
    			var curvePoint = link.triple;
    			var pathStart = math.calculateIntersection(curvePoint, link.subject, 1);
    			var pathEnd = math.calculateIntersection(curvePoint, link.object, 1);
    
    			return curveFunction([pathStart, curvePoint, pathEnd]);
        });
      }  
      
      simulation
        .nodes(nodes)
        .on("tick", recalculatePositions);
  
      simulation.force("link")
        .links(hiddenLinks);
      
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
  
  updateStatistics(knots) {
    this.get('#number-of-knots').innerHTML = knots.length;
    this.get('#number-of-triples').innerHTML = knots.filter(k => k.isTriple()).length;
  }
}