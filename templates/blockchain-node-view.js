import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v3.js';

import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import TransactionNetworkView from 'src/blockchain/view/transactionNetworkView.js';

import BlockNetworkView from 'src/blockchain/view/blockNetworkView.js';

export default class BlockchainNodeView extends Morph {
  async initialize() {
    this.windowTitle = "BlockchainNodeView";
    this._svg = this.shadowRoot.querySelector("#svgContainer");
    
    this.nodeClickHandler = (node) => { console.log("click! --> " + node.name); }
    this._displayedNodes = [];
    this._displayedLinks = [];
    this._newNodes = [];
    this._newLinks = [];
    this._svg.setAttribute('width', this.shadowRoot.querySelector("#content").offsetWidth);
    this._svg.setAttribute('height', this.shadowRoot.querySelector("#content").offsetHeight);
  }
  
  reset() {
    this._displayedNodes = [];
    this._displayedLinks = [];
    this._newNodes = [];
    this._newLinks = [];
  }
  
  addNode(node) {
    this._newNodes.push(node);
    return this;
  }
  
  addNodes(nodes) {
    this._newNodes = this._newNodes.concat(nodes);
    return this;
  }
  
  addLink(link) {
    this._newLinks.push(link);
    return this;
  }
  
  addLinks(links) {
    this._newLinks = this._newLinks.concat(links);
    return this;
  }
  
  draw() {
    const that = this;
    const allNodes = this._displayedNodes.concat(this._newNodes);
    const allLinks = this._displayedLinks.concat(this._newLinks);
    const svg = d3.select(this._svg);
    const width = svg.attr("width");
    const height = svg.attr("height");
    const newMarker = "newEnd";
    const oldMarker = "oldEnd";
    
    // remove all elements before drawing new ones
    svg.selectAll("*").remove();
    
    const force = d3.layout.force()
      .gravity(0.05)
      .distance(width/2)
      .charge(-100)
      .size([width, height]);
    
    force
      .nodes(allNodes)
      .links(allLinks)
      .start();
    
    this._addMarker(svg, oldMarker, false);
    this._addMarker(svg, newMarker, true);

    const link = svg.selectAll(".link")
      .data(allLinks)
      .enter()
      .append("line")
      .classed("link", true)
      .each(function(d, i) {
        if (i < that._displayedLinks.length) {
          this.setAttribute("marker-end", "url(#" + oldMarker + ")")
          return;
        }
        
        // overwrite marker end with new marker
        this.classList.add("animationStroke");
        this.setAttribute("marker-end", "url(#" + newMarker + ")")
      });

    const node = svg.selectAll(".node")
      .data(allNodes)
      .enter()
      .append("g")
      .call(force.drag)
      .classed("node", true)
      .on("click", function(d) {
        if (!that.nodeClickHandler) {
          return;
        }
        
        that.nodeClickHandler(d);
      })
      .each(function(d, i) {
        if (i < that._displayedNodes.length) {
          // must be an old node
          return;
        }
        
        this.classList.add("animationFill");
      });
    
    node
      .append("circle")
      .classed("bubble", true)
      .each(function(d, i) {
        if (i < that._displayedNodes.length) {
          // must be an old node
          return;
        }

        this.classList.add("animationFill");
      });
    
    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });
    
    
    force.on("tick", function() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
    
    this._displayedNodes = allNodes;
    this._displayedLinks = allLinks;
    this._newNodes = [];
    this._newLinks = [];
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
      .classed("linkEnd", true);
    
    if (!animation) {
      return marker;
    }
    
    return marker.classed("animationFill", true);
  }
  
  async livelyExample() {
    const node1 = new BlockchainNode();
    const node2 = new BlockchainNode();
    
    node1.mine();
    await new Promise(sleep => setTimeout(sleep, 3000));
    
    const tx1 = node1.sendTransaction([
      {"receiver": node2.wallet, "value": node1.wallet.value / 2}
    ]);
    
    node1.mine();
    await new Promise(sleep => setTimeout(sleep, 3000));
    
    const tx2 = node2.sendTransaction([
      {"receiver": node1.wallet, "value": node2.wallet.value / 2},
    ]);
    
    /*
    const view = new TransactionNetworkView(this)
      .addTransactions([
        tx1,
        tx2,
      ]);
    */
    
    const view = new BlockNetworkView(this);
    
    node1.blockchain.forEach((block) => view.addBlock(block));
    
    view.draw();
  }
  
  async __livelyExample2() {
    this._newNodes = [
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
        "name": "#0123abcdef",
        "group": 1
      }
    ];
    
    this._newLinks = [
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