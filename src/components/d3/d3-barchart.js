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
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    
    
    var bounds = this.getBoundingClientRect()
    this.get("svg").innerHTML = ""

    var treeData = this.getData()
    if (!treeData) return; // nothing to render

    var margin = { top: 20, right: 20, bottom: 20, left: 20 }
    var width = bounds.width,
      height = bounds.height;
    
    var data = this.getData();
    if (!data) return;// nothing to to

    var width = lively.getExtent(this).x - 30
    
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.x1)])
        .range([0, width]);

    
    var lineHeight = 20
    
    
    var y =  d3.scaleBand()
      .domain(data.map((ea, i) => i))
      .range([0, lineHeight * data.length]);
    y.paddingInner(0.1);    
    
    var svgOuter = d3.select(this.get("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
    
    svgOuter.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(d3.zoom()
          .scaleExtent([1 / 4, 20])
          .on("zoom", () => {
            zoomG.attr("transform", d3.event.transform);
          }));
    var zoomG = svgOuter.append("g")
    
    var svg = zoomG.append("g")
    
    var vis = this
    
    
    var node = svg
      .selectAll("g")
        .data(data)
      .enter().append("g")
  
    var dataX = d =>  x(d.x0) + "px"
    var dataY = (d, i) =>  y(i)  /* ((lineHeight + margin) * i) + "px" */
    var dataHeight = d => y.bandwidth() + "px"
    var dataWidth = d =>  x(d.x1 - d.x0) + "px"
    
    var rect = node.append("rect")
        .attr("x", dataX)
        .attr("y", dataY)
        .attr("height", dataHeight)
        .attr("width", dataWidth)
        .attr("fill", d =>  this.dataColor(d))
    
    rect.append("title")
       .text(d => d.label);  
    
    rect.on("click", function(d) {
        vis.onNodeClick(d, d3.event, this) 
    })
    
    
    var shouldPlaceLabelLeft = d => x(d.x0) < 100
    
    var label = node.append("text") 
        .attr("x",  d => {
            // return  x(d.x0 + 0.5 * (d.x1 - d.x0)) + "px"
            if (shouldPlaceLabelLeft(d)) {
              return x(d.x1) + 5 + "px"
            }
            return x(d.x0) - 5 + "px"
          })
        .attr("y", (d, i) =>  (y(i) + 0.5 * lineHeight)  + "px")
        .attr("height", dataHeight)
        .attr("width", dataWidth)
        .attr('text-anchor', d => {
          if (shouldPlaceLabelLeft(d)) {
            return 'start'
          } else {
            return 'end'
          }
        })
        .attr('alignment-baseline', 'middle')
        .attr("fill" ,"black")
        .text(d => d.label);
    
      label.append("title")
       .text(d => d.log.mode + " " + d.label + " " + d.log.time.toFixed(2) + "ms");  

      var xAxis = d3.axisBottom(x);
      var xAxisGroup = svg.append("g").call(xAxis);
      xAxisGroup.attr("transform", `translate(0, ${y(data.length - 1) + lineHeight})`)

      var yAxis = d3.axisLeft(y);
      var yAxisGroup = svg.append("g").call(yAxis);
      // yAxisGroup.attr("transform", `translate(0, ${y(data.length - 1) + lineHeight})`)
    
      //     'text-anchor': 'middle',
      //     'alignment-baseline': 'hanging',
      //   })
      //   .styles({
      //     'font-family': 'sans-serif',
      //     'font-size': (12 / scale) + 'pt',
      //   })
    
//     rect.append("title") 
//         .text(d => d.label);
    
        // .attr("title", d => d.label)
        // .on("click", function(d) {
        //   vis.onNodeClick(d, d3.event, this) 
        // })
        // .text(d => d.label);
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
