"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v3.js';

export default class BlockchainNodeView extends Morph {
  async initialize() {
    this.windowTitle = "BlockchainNodeView";
    this._svg = this.shadowRoot.querySelector("#svgContainer");
    
    this._displayedNodes = [];
    this._displayedLinks = [];
    this._nodes = [];
    this._links = [];
  }
  
  get nodes() {
    return this._nodes;
  }
  
  get links() {
    return this._links;
  }
  
  draw() {
    const svg = d3.select(this._svg);
    const width = svg.attr("width");
    const height = svg.attr("height");
    const displayedMarker = "displayedEnd";
    const newMarker = "end";
    
    // remove all elements before drawing new ones
    svg.selectAll("*").remove();
    
    const force = d3.layout.force()
      .gravity(0.05)
      .distance(100)
      .charge(-100)
      .size([width, height]);
    
    force
      .nodes(this._displayedNodes.concat(this._nodes))
      .links(this._displayedLinks.concat(this._links))
      .start();
    
    this._addMarker(svg, displayedMarker, false);
    this._addMarker(svg, newMarker, true);
    /*
    // build the arrow.
    svg.append("svg:defs").selectAll("marker")
      .data(["end"])      // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "linkEnd");
    */
    
    let link = d3.merge(
      this._addLink(svg, this._displayedLinks, displayedMarker, false),
      this._addLink(svg, this._links, newMarker, true)
    );
    
    /*
    const link = svg.selectAll(".link")
      .data(this._links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("marker-end", "url(#end)");
    */
    
    const node = d3.merge(
      this._addNode(svg, this._displayedNodes, force, false),
      this._addNode(svg, this._nodes, force, true)
    );
    
    /*
    const node = svg.selectAll(".node")
      .data(this._nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);
    
    const bubble = node.append("circle");
    
    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });
    */
    
    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
    
    this._displayedNodes = this._displayedNodes.concat(this._nodes);
    this._displayedLinks = this._displayedLinks.concat(this._links);
    this._nodes = [];
    this._links = [];
  }
  
  _addMarker(svg, markerName, animation) {
    // build the arrow.
    const marker = svg.append("svg:defs").selectAll("marker")
      .data([markerName])      // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "linkEnd");
    
    if (!animation) {
      return marker;
    }
    
    return this._addAnimation(marker, "fillGray");
  }
  
  _addLink(svg, links, markerName, animation) {
    const link = svg.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("marker-end", "url(#" + markerName + ")");
    
    if (!animation) {
      return link;
    }
    
    return this._addAnimation(link, "strokeGray");
  }
  
  _addNode(svg, nodes, force, animation) {
    const node = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag)
      .append("circle")
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });
    
    if (!animation) {
      return node;
    }
    
    return this._addAnimation(node, "fillGray");
  }
  
  _addAnimation(svgElement, animationName) {
    svgElement.attr("-webkit-animation-name", animationName);
    svgElement.attr("-webkit-animation-duration", "10s");
    
    return svgElement;
  }
  
  async livelyExample() {
    this._nodes = [
      {
        "name": "#1234567890",
        "group": 1
      },
      {
        "name": "#0987654321",
        "group": 1
      },
      {
        "name": "#abcdef1234",
        "group": 1
      },
      {
        "name": "0123abcdef",
        "group": 1
      }
    ];
    
    this._links = [
      {
        "source": 0,
        "target": 1,
        "value": 1
      },
      {
        "source": 0,
        "target": 2,
        "value": 1
      },
      {
        "source": 0,
        "target": 3,
        "value": 1
      }
    ];
    
    this.draw();

  }
}