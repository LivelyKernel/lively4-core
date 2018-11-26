import Morph from "src/components/widgets/lively-morph.js"
import D3Component from "./d3-component.js"
import d3 from "src/external/d3.v5.js"
import { debounce } from "utils";
import "src/external/d3-selection-multi.v1.js"

/*
 *
 */
export default class D3BarChart extends D3Component {

  async initialize() {
    this.options = {}
    this.loaded = new Promise(async (resolve) => {

      this.updateViz()
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      resolve()
    })
  }

  async updateViz() {
    var data = this.getData();
    if (!data) return;// nothing to to

    var width = lively.getExtent(this).x - 30
    
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.x1)])
        .range([0, width]);
    d3.max
    var chart = this.get(".chart")
    chart.innerHTML = ""
    var vis = this
    d3.select(chart)
      .selectAll("div")
        .data(data)
      .enter().append("div")
        .style("margin-left", d =>  x(d.x0) + "px")
        .style("width", d =>  x(d.x1 - d.x0) + "px")
        .attr("title", d => d.label)
        .on("click", function(d) {
          vis.onNodeClick(d, d3.event, this) 
        })
        .text(d => d.label);
  }

  onExtentChanged() {
    this.updateViz()
  }

  async livelyExample() {
    await this.loaded
    this.setData([
      {label: "a", x0: 0,  x1: 14}, 
      {label: "b", x0: 3, x1: 8}, 
      {label: "c", x0: 5, x1: 15}, 
      {label: "d", x0: 2, x1: 16}, 
      {label: "e", x0: 0, x1: 23}, 
      {label: "f", x0: 10, x1: 42}
    ])
    this.updateViz() 
  }

  livelyMigrate(other) {
    this.options = other.options
    this.setData(other.getData())
  }

}
