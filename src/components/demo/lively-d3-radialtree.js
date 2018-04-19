import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import { debounce } from "utils";


export default class LivelyD3RadialRree extends Morph {

  
  getTreeData() {
    if (!this.treeData) {
      this.treeData = {
          "name": "Top Level",
          "children": [
            { 
              "name": "Level 2: A",
              "children": [
                { "name": "Son of A",
                  size: 50},
                { 
                  "name": "Daughter of A",
                  size: 30}
              ]
            },
            { "name": "Level 2: B",
            size: 20}
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
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
    // window.d3 = d3
    // System.import("src/client/container-scoped-d3.js")
  }
  
  updateViz() {        
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""
           
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg  = svg
    
    var g = svg.append("g").attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");
    var tree = d3.tree()
        .size([2 * Math.PI, 500])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
     
    var data = this.getTreeData()
    var root =  tree(d3.hierarchy(data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; }))      
        
    var link = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(function(d) { return d.x; })
            .radius(function(d) { return d.y; }));

    var node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", 2.5);

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
        .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
        .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
        .text(function(d) { return d.data.id.substring(d.data.id.lastIndexOf(".") + 1); });

    function radialPoint(x, y) {
      return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
    }

  }
  
  onExtentChanged() {
    this.updateViz()
  }
  
  async livelyExample() {
    this.setTreeData(await d3.json(lively4url + "/src/components/demo/flare.json"))
  }
 
  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
    this.dataColor = other.dataColor

  }
  
}
