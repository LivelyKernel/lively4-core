import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import { debounce } from "utils";


export default class D3PlainTree extends Morph {

  initialize() {  
    this.d3 = d3 // for scripting...
    this.updateViz()
    this.addEventListener('extent-changed', ((evt) => { debugger; this.onExtentChanged(evt); })::debounce(500));
  }

  get value() {
    return this._value || "tree"
  }
  
  

  set value(value) {
    this._value = value
  }

  getTreeData() {
    return this.treeData
  }

  setTreeData(data) {
    this.treeData = data;
    this.updateViz()
  }

  updateViz() {
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""

    
    var treeData = this.getTreeData()
    if (!treeData) return; // nothing to render
    
    var margin = { top: 20, right: 120, bottom: 20, left: 120 }
    var width = bounds.width,
      height = bounds.height;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg = svg

    var g = svg.append("g").attr("transform", "translate(-60,0)");

    var tree = d3.tree()
      .size([height, width - 160]);

    var cluster = d3.cluster()
      .size([height, width - 160]);

    var data = this.getTreeData()
    var root = tree(d3.hierarchy(data)
      .eachBefore((d) => { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name }))

    tree(root); // or 
    // cluster(root)

    var link = g.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", this.diagonal);

    var node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    node.append("circle")
      .attr("r", 2.5);

    node.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children ? -8 : 8; })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) { return d.data.name });    
  }

    diagonal(d) {
      return "M" + d.y + "," + d.x +
        "C" + (d.parent.y + 100) + "," + d.x +
        " " + (d.parent.y + 100) + "," + d.parent.x +
        " " + d.parent.y + "," + d.parent.x;
    }

  // Collapse the node and all it's children
  collapse(d) {
    if (d.children) {
      d._children = d.children
      d._children.forEach(ea => this.collapse(ea))
      d.children = null
    }
  }


  livelyInspect(contentNode, inspector) {
    if (this.treeData) {
      contentNode.appendChild(inspector.display(this.treeData, false, "#tree-data", this));
    }
  }

  onExtentChanged() {
    lively.notify("extent changed")
    this.updateViz()
  }

  async livelyExample() {

    this.setTreeData(await d3.json(lively4url + "/src/components/demo/flare.json"))

  }

  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
  }

}
