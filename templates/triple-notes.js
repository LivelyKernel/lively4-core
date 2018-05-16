import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';

import d3 from 'src/external/d3.v4.js';

import {
  Graph,
  TAG_URL,
  IS_A_URL,
  SAME_AS_URL,
  CONTAINS_URL
} from 'src/client/triples/triples.js';
import * as drawTools from 'src/client/triples/drawTools.js';
import * as math from 'src/client/triples/math.js';

import { aexpr } from "frame-based-aexpr";

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
  'pptx': ['presentation'],
  'md': ['markdown'],
  'htm': ['html'],
  'html': ['html'],
  'json': ['data'],
  'csv': ['data']
}
const cssClassesByTagURL = {
  [TAG_URL]: ['tag'],
  [IS_A_URL]: ['is-a'],
  [SAME_AS_URL]: ['same-as'],
  [CONTAINS_URL]: ['contains'],
}
class Node {
  static getCSSClassesByType(node) {
    
  }
  constructor(knot, label) {
    this.knot = knot;
    //this.r = ~~d3.randomUniform(8, 28)();
    const fileEnding = this.getFileEnding();
    const shouldRenderSizeAware = (fileEnding === 'md' || fileEnding === 'html') &&
     this.knot.content && this.knot.content.split;
    this._radius = shouldRenderSizeAware ?
      Math.min((this.knot.content.split(/\r?\n/).length + 10) * 0.9, 100) :
	    40;
	 this._width = 60;
	 this._height = 20;
  }
  getKnot() { return this.knot; }
  label() { return this.knot.label(); }
  isTriple() { return this.knot.isTriple(); }
  isExternal() {  return Graph.isExternalURL(new URL(this.knot.url)); }
  getFileEnding() { return this.knot.url.split('#').shift().split('?').shift().split('.').pop(); }
  
  draw(parentElement, additionalCssClasses) {
    let cssClasses;
    
    if(this.knot.isTriple()) {
      cssClasses = cssClassesByTagURL[this.knot.predicate.url] || ['unspecified'];
      cssClasses.push('nostroke')
    } else {
      const fileEnding = this.getFileEnding();
      //lively.notify(fileEnding)
  		cssClasses = cssClassesByFileType[fileEnding] ?
  		  cssClassesByFileType[fileEnding] :
  		  (lively.notify(fileEnding), ['white']);
    }
		
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
  
  isLoop() {
    return this.subject === this.object;
  }
  linkParts() {
    return [this.frontPart, this.backPart];
  }
  
  draw(linkGroup, markerContainer) {
    linkGroup.append("path")
    .classed("link-path", true)
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

/*
 * ========================================================
 * ========================================================
 * ========================================================
 */
export default class TripleNotes extends Morph {

  async getKnots() {
    let graph = await Graph.getInstance();
    return graph.knots;
  }

  setSize() {
    let parentElement = this.get('#graph');
    
    this.width = parentElement.clientWidth;
    this.height = parentElement.clientHeight;

    let margin = { top: 0, left: 0, bottom: 0, right: 0 };

    this.chartWidth = this.width - (margin.left + margin.right);
    this.chartHeight = this.height - (margin.top + margin.bottom);

    this.svg
      .attr("width", this.chartWidth)
      .attr("height", this.chartHeight)
      .attr("transform", "translate("+[margin.left, margin.top]+")");
  }

  async initialize() {
    this.windowTitle = "Knot Explorer";
    
    this.registerButtons();
    
    this.svg = d3.select(this.get('#graph'))
      .append("svg");
      
    this.graphContainer = this.svg
      .append("g")
        .classed("graphContainer", true);

    this.setSize();
    lively.addEventListener("triple-notes", this, "extent-changed", e => this.setSize());

    this.drawChart(await this.getNodes());

    //let initialTransform;
    //if(
    //  this.zoomScale !== "" &&
    //  this.zoomTranslateX !== "" &&
    //  this.zoomTranslateY !== ""
    //) {
    //  initialTransform = d3.zoomIdentity;
    //    initialTransform.translate(this.zoomTranslateX, this.zoomTranslateY)
    //    initialTransform.scale(this.zoomScale);
    //  lively.notify(`Adapt init: ${this.zoomTranslateX},${this.zoomTranslateY}`)
    //}
    this.svg
      //.attr("transform", initialTransform)
      .call(this.zoomBehavior());
      //.call(zoomBehavior.scaleTo(1.2).event);
    
    this.prepareConfig();
  }
  
  async getNodes() {
    let knots = await this.getKnots();
    this.setupStatistics(knots);
    
    let nodes = knots.map(getNodeByKnot);
    let links = nodes
      .filter(node => node.isTriple())
      .map(node => new Link(node));
    
    let hiddenLinks = [];
		links.forEach(link => hiddenLinks = hiddenLinks.concat(link.linkParts()));

    return {
      nodes,
      links,
      hiddenLinks
    };
  }


  
  drawChart({ nodes, links, hiddenLinks }) {
    
    // hidden link parts
    let linkPartContainer = this.graphContainer.append("g").classed("linkPartContainer", true);
    var hiddenLinkElements = linkPartContainer.selectAll("line")
      .data(hiddenLinks).enter()
      .append("line")
      .style("stroke", "black")
      .style("stroke-opacity", 0.1)
      .style("stroke-width", 10);
    
    // Curved, visible  Links
    let linkContainer = this.graphContainer.append("g").classed("linkContainer", true);
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
			.x(d => d.x)
			.y(d => d.y)
      .curve(d3.curveNatural);

    // Visible Knots -> Nodes
    let nodeContainer = this.graphContainer.append("g").classed("nodeContainer", true);
    let nodeElements = nodeContainer.selectAll(".node")
      .data(nodes).enter()
      .append("g")
      .attr("class", "node")
      .call(this.dragBehavior())
      .on("dblclick", async node => { 
        d3.event.stopPropagation();
        d3.event.preventDefault();
        
        let knotView = await lively.openComponentInWindow("knot-view");
        knotView.loadKnotForURL(node.getKnot().url);
      })
      .on("click", node => {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        
        this.get('#knot-view').loadKnotForURL(node.getKnot().url);
      })
      .on("mouseout", node => {})
      .on("contextmenu", async node => {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        
        ContextMenu.openIn(document.body, d3.event, node.getKnot(), undefined, node.getKnot().collectContextMenuItems());
      });

    nodeElements.each(function (node) {
			node.draw(d3.select(this));
    });

    nodeElements.append("text")
      .attr("class", "text")
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .text(d => d.label());

    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.index).distance(200))
      //.force("collide",d3.forceCollide(d => d.r + 8).iterations(16) )
      .force("charge", d3.forceManyBody().strength(node => node.isTriple() ? -190*0.5 : -190))
      .force("center", d3.forceCenter(this.chartWidth / 2, this.chartHeight / 2))
      .force("y", d3.forceY(0).strength(0.001))
      .force("x", d3.forceX(0).strength(0.001));

    // Define this.Simulation
    this.simulation
      .nodes(nodes)
      .on("tick", function recalculatePositions() {
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
      });

    this.simulation.force("link")
      .links(hiddenLinks);
  }
  
  onReload() {
    lively.notify(123);
  }

  prepareConfig() {
    // links
    var linkDistance = this.get('#link-distance');
    linkDistance.addEventListener('input', () => {
      lively.notify(`New link distance is ${linkDistance.value}`);
      this.simulation.force("link").distance(linkDistance.value);
      this.simulation.alpha(1).restart();
    });
    
    // nbody
    let updateCharge = () => {
      let knotChargeValue = knotCharge.value;
      let tripleChargeValue = tripleCharge.value;
      this.simulation.force("charge").strength(node => node.isTriple() ? -tripleChargeValue : -knotChargeValue);
    }
    var knotCharge = this.get('#nbody-knot-strength');
    knotCharge.addEventListener('input', () => {
      lively.notify(`New knot charge is ${knotCharge.value}`);
      updateCharge();
      this.simulation.alpha(1).restart();
    });
    var tripleCharge = this.get('#nbody-triple-strength');
    tripleCharge.addEventListener('input', () => {
      lively.notify(`New triple charge is ${tripleCharge.value}`);
      updateCharge();
      this.simulation.alpha(1).restart();
    });

    // center
    var forceCenterX = this.get('#force-center-x');
    forceCenterX.addEventListener('input', () => {
      lively.notify(`New center x is ${forceCenterX.value}`);
      this.simulation.force("center").x(forceCenterX.value);
      this.simulation.alpha(1).restart();
    });
    var forceCenterY = this.get('#force-center-y');
    forceCenterY.addEventListener('input', () => {
      lively.notify(`New center y is ${forceCenterY.value}`);
      this.simulation.force("center").y(forceCenterY.value);
      this.simulation.alpha(1).restart();
    });
    
    // x and y
    var forceXTarget = this.get('#force-x-target');
    forceXTarget.addEventListener('input', () => {
      lively.notify(`New force x target is ${forceXTarget.value}`);
      this.simulation.force("x").x(forceXTarget.value);
      this.simulation.alpha(1).restart();
    });
    var forceYTarget = this.get('#force-y-target');
    forceYTarget.addEventListener('input', () => {
      lively.notify(`New force y target is ${forceYTarget.value}`);
      this.simulation.force("y").y(forceYTarget.value);
      this.simulation.alpha(1).restart();
    });
    var forceXStrength = this.get('#force-x-strength');
    forceXStrength.addEventListener('input', () => {
      lively.notify(`New force x strength is ${forceXStrength.value}`);
      this.simulation.force("x").strength(forceXStrength.value);
      this.simulation.alpha(1).restart();
    });
    var forceYStrength = this.get('#force-y-strength');
    forceYStrength.addEventListener('input', () => {
      lively.notify(`New force y strength is ${forceYStrength.value}`);
      this.simulation.force("y").strength(forceYStrength.value);
      this.simulation.alpha(1).restart();
    });
  }

  get zoomTranslateX() {
    return this.getAttribute('data-zoom-translate-x');
  }
  set zoomTranslateX(x) {
    this.setAttribute("data-zoom-translate-x", x);
    return this.zoomTranslateX;
  }
  get zoomTranslateY() {
    return this.getAttribute('data-zoom-translate-y');
  }
  set zoomTranslateY(y) {
    this.setAttribute("data-zoom-translate-y", y);
    return this.zoomTranslateY;
  }
  get zoomScale() {
    return this.getAttribute('data-zoom-scale');
  }
  set zoomScale(scale) {
    this.setAttribute("data-zoom-scale", scale);
    return this.zoomScale;
  }
  zoomBehavior() {
    let zoom = d3.zoom()
			.duration(150)
    	.scaleExtent([MIN_MAGNIFICATION, MAX_MAGNIFICATION])
      .on("zoom", () => {
        //try {
        //  this.zoomTranslateX = d3.event.transform.x;
        //  this.zoomTranslateY = d3.event.transform.y;
        //  this.zoomScale = d3.event.transform.k;
        //  lively.notify(`${this.zoomTranslateX}, ${this.zoomTranslateY}, ${this.zoomScale}`);
        //} catch (e) {
        //  lively.notify('X', 'y', 'red')
        //}
        this.graphContainer.attr("transform", d3.event.transform)
      });

    //if(
    //  this.zoomScale !== "" &&
    //  this.zoomTranslateX !== "" &&
    //  this.zoomTranslateY !== ""
    //) {
    //  let initialTransform = d3.zoomIdentity
    //    .translate(this.zoomTranslateX, this.zoomTranslateY)
    //    .scale(this.zoomScale);

    //  zoom.scaleTo(this.graphContainer, this.zoomScale);
    //  zoom.translateBy([
    //    this.zoomTranslateX,
    //    this.zoomTranslateY
    //  ]);

    //  this.graphContainer.call(zoom, initialTransform);
    //}
    
    return zoom;
  }

  dragBehavior() {
    return d3.drag()
      .on("start", d => {
        if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on("end", d => {
        if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  setupStatistics(knots) {
    const statistics = this.get('#statistics');
    const numberOfKnots = aexpr(() => knots.length);
    const numberOfTriples = aexpr(() => knots.filter(k => k.isTriple()).length);

    statistics.appendChild(<div><span>Knots: {numberOfKnots}</span></div>);
    statistics.appendChild(<div><span>Triple: {numberOfTriples}</span></div>);
  }
}