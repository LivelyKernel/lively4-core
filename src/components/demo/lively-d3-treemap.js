import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import { debounce } from "utils";


export default class LivelyD3Treemap extends Morph {

  
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
    var bounds = this.get('svg').getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""
    
    var treeData = this.getTreeData()
        
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg  = svg

    var  
      // color = d3.scaleOrdinal(d3.schemeAccent),
      color = d3.scaleOrdinal(d3.schemeBlues[9]),
      format = d3.format(",d");

    var treemap = d3.treemap()
      .tile(d3.treemapResquarify)
      .size([width, height])
      .round(true)
      .paddingInner(2)
      .paddingTop(20)
    
    this.root = d3.hierarchy(treeData)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(d => d.size)
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });
 
    treemap(this.root);
    
    var cell = svg.selectAll("g")
      .data(this.root.descendants())
      .enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", d => d.data.id)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => {
          if(this.dataColor) return this.dataColor(d.data);
          if(d.parent) return color(d.parent.data.id)
          return 'lightgrey';
          // fill: cadetblue;
          // opacity: 0.3;
          // stroke: white;
        });

    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.data.id; })
      .append("use")
        .attr("xlink:href", function(d) { return "#" + d.data.id; });

    cell.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
      .selectAll("tspan")
        .data(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
      .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) { return 13 + i * 10; })
        .text(function(d) { return d; });

    cell.append("title")
        .text(d => this.dataTitle ? this.dataTitle(d.data) : d.data.id + "\n" + format(d.value) );
  }
  
  onExtentChanged() {
    this.updateViz()
  }
  
  async livelyExample() {
    // this.setTreeData(await d3.json(lively4url + "/src/components/demo/flare.json"))
  }
 
  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
    this.dataColor = other.dataColor

  }
  
}
