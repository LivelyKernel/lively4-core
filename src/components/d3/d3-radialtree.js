import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import { debounce } from "utils";
import scriptManager from  "src/client/script-manager.js";

// #TODO use lib
function radialPoint(x, y) {
  return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
}

export default class D3RadialRree extends Morph {

  getTreeData() {
    if (!this.treeData) {
      var data = this.getAttribute("tree-data")
      if (data) {
        try {
          this.treeData = JSON.parse(data)
        } catch(e) {
          console.warn(this.constructor.name + ": could not parse tree-data: " + e)
        }
      } else {
        this.treeData = {}
      }
    }
    return this.treeData
  }
  
  setTreeData(data) {
    this.treeData = data;
    this.updateViz()
  }
  
  async initialize() {   
    this.d3 = d3 // for scripts... that cannot use modules
    this.updateViz()
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
    // window.d3 = d3
    // System.import("src/client/container-scoped-d3.js")
  }
  
  updateViz() {
    var svgNode = this.shadowRoot.querySelector("svg")
    svgNode.innerHTML = ""
    var bounds = this.getBoundingClientRect()      
    var width = bounds.width,
      height = bounds.height;

    var svg = d3.select(svgNode)
      .attr("width", width )
      .attr("height", height)
    
    var  
      // color = d3.scaleOrdinal(d3.schemeAccent),
      color = d3.scaleOrdinal(d3.schemeBlues[9]);
    
    // Zoom and Pan - Behavior
    svg.append("rect") // the "additional rect" captures events
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
    var zoom = svg.append("g"); // this intermediate "g" node moves the view
    svg.style("pointer-events", "all")
        .call(d3.zoom()
          .scaleExtent([1 / 2, 4])
          .on("zoom", () => zoom.attr("transform", d3.event.transform)));
    
    var g = zoom.append("g")
      .attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");
    var tree = d3.tree()
        .size([2 * Math.PI, 500 ])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
     
    var data = this.getTreeData()
    var root =  tree(d3.hierarchy(data)
      .eachBefore((d) => { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name}))      
        
    var link = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d =>d.y));

    var node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
        .attr("class", d  => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("fill", d => this.dataColor ? this.dataColor(d) : undefined)
        .attr("transform", d => "translate(" + radialPoint(d.x, d.y) + ")")
        
        
    node.append("circle")
        .attr("r", d => this.dataSize ? this.dataSize(d) : 2.5)
        .on("click", (d) => {
          if(this.dataClick) this.dataClick(d, d3.event)
        });

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .attr("transform", d => "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")")
        .text(d => d.data.name)
  }
  
  
  onExtentChanged() {
    this.updateViz()
  }
  
  async livelyExample() {
    
    scriptManager.addScript(this, function(d) { return Math.sqrt(d.data.size) * 0.1 }, {name: "dataSize"});    
    scriptManager.addScript(this, function(d) { 
      if (this.colorScale) {
        
      }
      this.colorScale = this.d3.scaleSequential(d3.interpolatePiYG)
      return this.colorScale(d.data.size * 0.0001) 
    }, {name: "dataColor"});
    
    scriptManager.addScript(this, (d) => {
      return d.id
    } , {name: "dataTitle"});
    
    
    this.setTreeData(await d3.json(lively4url + "/src/components/demo/flare.json"))
    
    
  }
 
  livelyPrepareSave() {
    if (this.treeData) {
      var data = JSON.stringify(this.treeData)
      this.setAttribute("tree-data", data)
    }    
  }
  
  livelyInspect(contentNode, inspector) {
    if (this.treeData) {
      contentNode.appendChild(inspector.display(this.treeData, false, "#tree-data", this));
    }
  }
  
  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
    this.dataColor = other.dataColor
    this.dataSize = other.dataSize

  }
  
}
