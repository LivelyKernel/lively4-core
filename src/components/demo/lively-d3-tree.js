import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"


export default class LivelyD3Tree extends Morph {

  getTreeData() {
    if (!this.treeData) {
      this.treeData = {
          "name": "Top Level",
          "children": [
            { 
              "name": "Level 2: A",
              "children": [
                { "name": "Son of A" },
                { "name": "Daughter of A" }
              ]
            },
            { "name": "Level 2: B" }
          ]
        };
    }
    return this.treeData
  }
  
  setTreeData(data) {
    this.treeData = data;
    this.updateViz()
  }
  
  async initialize() {   
    this.updateViz()
    
    // window.d3 = d3
    // System.import("src/client/container-scoped-d3.js")
  }
  
  updateViz() {
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var treeData = this.getTreeData()
        
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg  = svg
    
    this.i = 0;
    
    this.duration = 750
    var root;

    var treemap = d3.tree().size([height, width]);
    this.treemap = treemap

    root = d3.hierarchy(treeData, d => d.children );
    root.x0 = height / 2;
    root.y0 = 0;
    this.root = root

    // Collapse after the second level
    root.children && root.children.forEach(ea => this.collapse(ea));
    
    this.update(root);
    // d3.select(self.frameElement).style("height", "500px");    
  }
  
  // Collapse the node and all it's children
  collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(ea => this.collapse(ea))
      d.children = null
    }
  }
  
  // Toggle children on click.
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

    // Assigns the x and y position for the nodes
    var treeData = this.treemap(this.root);
    
    // Compute the new tree layout
    const nodes = treeData.descendants()
    const links = treeData.descendants().slice(1) // links() // 
        
    // Normalize for fixed-depth.
    nodes.forEach((d) => { d.y = d.depth * 180; });

    // Update the nodes…
    var node = this.svg.selectAll("g.node")
      .data(nodes, (d) => d.id || (d.id = ++this.i));

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
      .on("click", (d) => this.click(d));

    // Add Circle for the nodes
    nodeEnter.append("circle")
      .attr('class', 'node')
      .attr("r", 1e-6)
      .style("fill", d => d._children ? "lightsteelblue" : "#fff");

    // Add labels for the nodes
    nodeEnter.append("text")
      .attr("x", d => d.children || d._children ? -13 : 13)
      .attr("dy", ".35em")
      .attr("text-anchor", d  => d.children || d._children ? "end" : "start")
      .text(d =>  this.dataName ? this.dataName(d.data) : d.data.name)
    // .style("fill-opacity", 1e-6);

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node)
        
    // Transition nodes to their new position.
    nodeUpdate.transition()
      .duration(this.duration)
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
    
    
    // Update the node attributes and style
    nodeUpdate.select("circle.node")
      .attr("r", 10)
      .style("fill", d => d._children ? "lightsteelblue" : "#fff")
      .attr('cursor', 'pointer');

    // nodeUpdate.select("text")
    //   .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(this.duration)
      .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select("circle")
      .attr("r", 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links...
    var link = this.svg.selectAll("path.link")
      .data(links, d => d.id);

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", (d) => {
        var o = {x: source.x0, y: source.y0};
        return this.diagonal(o, o);
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);
    
     // Transition back to the parent element position
    linkUpdate.transition()
      .duration(this.duration)
      .attr('d', d => {
        return this.diagonal(d, d.parent)
      })
      
    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(d => this.duration)
      .attr("d", (d) => {
        var o = {x: source.x, y: source.y};
        return this.diagonal(o, o);
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }  
  
  // Creates a curved (diagonal) path from parent to the child nodes
  diagonal(s, d) {
    var path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
    return path
  }
  
  livelyExample() {
    
  }
 
  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
  }
  
}
