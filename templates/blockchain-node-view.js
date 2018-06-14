"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v3.js';

export default class BlockchainNodeView extends Morph {
  async initialize() {
    this.windowTitle = "BlockchainNodeView";
    this._svg = this.shadowRoot.querySelector("#svgContainer");
    this._nodes = [];
    this._links = [];
  }
  
  draw() {
    const svg = d3.select(this._svg);
    const width = svg.attr("width");
    const height = svg.attr("height");
    
    // remove all elements before drawing new ones
    svg.selectAll("*").remove();
    
    const force = d3.layout.force()
      .gravity(0.05)
      .distance(100)
      .charge(-100)
      .size([width, height]);
    
    force
      .nodes(this._nodes)
      .links(this._links)
      .linkDistance(60)
      .start();
    
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
      .attr("d", "M0,-5L10,0L0,5");
    
    const link = svg.selectAll(".link")
      .data(this._links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("marker-end", "url(#end)");
    
    const node = svg.selectAll(".node")
      .data(this._nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);
    
    node.append("circle")
      .attr("r", "5")
      .attr("fill", "#2c2c2c")
      .attr("stroke-width", "2px");
    
    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });
    
    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
  }
  
  async livelyExample() {
    this._nodes = [
      {
        "name": "node1",
        "group": 1
      },
      {
        "name": "node2",
        "group": 1
      },
      {
        "name": "node3",
        "group": 1
      },
      {
        "name": "node4",
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