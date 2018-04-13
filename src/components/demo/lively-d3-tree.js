import Morph from "src/components/widgets/lively-morph.js"

/* globals d3 */

export default class LivelyD3Tree extends Morph {

  getTreeData() {
    if (!this.treeData) {
      this.treeData = [
        {
          "name": "Top Level",
          "children": [
            {
              "name": "Level 2: A",
              "children": [
                {
                  "name": "Son of A",
                },
                {
                  "name": "Daughter of A",
                }
              ]
            },
            {
              "name": "Level 2: B",
            }
          ]
        }
      ];
    }
    return this.treeData
  }
  
  setTreeData(data) {
    this.treeData = data;
    this.updateViz()
  }

  
  async initialize() {
   
    if (!window.d3 || !window.cola || !window.ScopedD3) {
      console.log("LOAD D3");
      await lively.loadJavaScriptThroughDOM("d3", "src/external/d3.v3.js");
      await System.import("src/client/container-scoped-d3.js");
    }
    this.updateViz()
  }
  
  updateViz() {
    var bounds = this.getBoundingClientRect()
   
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var treeData = this.getTreeData()
        
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    this.i = 0;
    
    this.duration = 750
    var  root;

    var tree = d3.layout.tree()
      .size([height, width]);
    this.tree = tree

    var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });
    this.diagonal = diagonal

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg  = svg
    
    root = treeData[0];
    root.x0 = height / 2;
    root.y0 = 0;
    this.root = root

    this.update(root);

    d3.select(self.frameElement).style("height", "500px");    

  // Toggle children on click.
  }
    
  click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.update(d);
  }
  
  update(source) {
    var tree = this.tree
    var root = this.root
    var svg = this.svg

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach((d) => { d.y = d.depth * 180; });

    // Update the nodes…
    var node = svg.selectAll("g.node")
      .data(nodes, (d) => d.id || (d.id = ++this.i));

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
      .on("click", (d) => this.click(d));

    nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", d => d._children ? "lightsteelblue" : "#fff");

    nodeEnter.append("text")
      .attr("x", d => d.children || d._children ? -13 : 13)
      .attr("dy", ".35em")
      .attr("text-anchor", d  => d.children || d._children ? "end" : "start")
      .text(d =>  this.dataName ? this.dataName(d) : d.name)
      .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(this.duration)
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    nodeUpdate.select("circle")
      .attr("r", 10)
      .style("fill", d => d._children ? "lightsteelblue" : "#fff");

    nodeUpdate.select("text")
      .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(this.duration)
      .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
      .remove();

    nodeExit.select("circle")
      .attr("r", 1e-6);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", (d) => {
        var o = {x: source.x0, y: source.y0};
        return this.diagonal({source: o, target: o});
      });

    // Transition links to their new position.
    link.transition()
      .duration(this.duration)
      .attr("d", d => this.diagonal(d));

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(d => this.duration)
      .attr("d", (d) => {
        var o = {x: source.x, y: source.y};
        return this.diagonal({source: o, target: o});
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }  
 
  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
  }
  
}
