"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js';

import eventDrops from 'https://unpkg.com/event-drops';

export default class AexprTimeline extends Morph {
  async initialize() {
    this.windowTitle = "AexprTimeline";
    this.data = [{value : 5}, {value : 12}];
    this.loaded = new Promise(async (resolve) => {
      this.updateViz()
      resolve()
    });

  }

  async updateViz() {
    let svgContainer = this.get("#container");
    
    svgContainer.style.width = this.style.width;
    svgContainer.style.height = this.style.height;        
    
    let bounds = this.getBoundingClientRect();
    this.get("svg").innerHTML = "";

    let margin = { top: 20, right: 20, bottom: 20, left: 20 };
    let height = bounds.height;
    
    var data = this.getData();
    if (!data) return;// nothing to to

    let width = lively.getExtent(this).x - 30
    
    let x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)+2])
        .range([0, width]);

    var lineHeight = 20;
    
    let y =  d3.scaleBand()
      .domain(data.map((ea, i) => i))
      .range([0, lineHeight * data.length]);
    y.paddingInner(0.1);    
    
    var svgOuter = d3.select(this.get("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    if (this.zoom) {
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
    }
    
    
    var zoomG = svgOuter.append("g");  
    var svg = zoomG.append("g");
    var vis = this;
    
    var node = svg
      .selectAll("g")
        .data(data)
      .enter().append("g");
  
    var dataX = d =>  x(d.value) + "px";
    var dataY = (d, i) =>  y(i);  /* ((lineHeight + margin) * i) + "px" */
    var dataHeight = d => y.bandwidth() + "px"
    var dataWidth = d =>  5 + "px"
    
    var rect = node.append("rect")
        .attr("x", dataX)
        .attr("y", dataY)
        .attr("height", dataHeight)
        .attr("width", dataWidth)
        .attr("fill", d =>  "red")
    
    // first level of children
    node.each(function(parentData, parentIndex) {
      var eachNode = d3.select(this);
      if (!parentData.children) return
      eachNode
        .selectAll("g")
           .data(parentData.children)
        .enter().append("rect")
            .attr("x", dataX)
            .attr("y", d => dataY(parentData, parentIndex))
            .attr("height", d => vis.dataHeight(d, dataHeight(d)))
            .attr("width", d => vis.dataWidth(d, dataWidth(d)))
            .attr("fill", d =>  vis.dataColor(d))
            .attr("opacity", d =>  0.5)
            .on("click", function(d) {
                vis.onNodeClick(d, d3.event, this)
            })
            .append("title")
              .text(d => 'text'); 
    })
 
    rect.append("title")
       .text(d => 'Title');  
    
    rect.on("click", function(d) {
        vis.onNodeClick(d, d3.event, this) 
    })
    
    
    var maxLabelWidth = 200 // not enforced?
    var shouldPlaceLabelLeft = d => x(d.x0) < maxLabelWidth 
    
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
        .text(d => 'data label');
    
      label.append("title")
       .text(d => 'title');  

      var xAxis = d3.axisBottom(x);
      var xAxisGroup = svg.append("g").call(xAxis);
      xAxisGroup.attr("transform", `translate(0, ${y(data.length - 1) + lineHeight})`)

      // we cannot zoom... so we grow ourself
      if (!this.zoom) {
        var yAxisHeight = lineHeight // guess
        var chartHeight = (y(data.length - 1) +  lineHeight) + yAxisHeight
        svgContainer.style.height =  margin.top +  chartHeight + margin.bottom + "px"
      }
    
      var yAxis = d3.axisLeft(y);
      var yAxisGroup = svg.append("g").call(yAxis);
  }
  
  getData() {
    return this.data
  }

  setData(data) {
    this.data = data;
    this.updateViz()
  }  
  
  
}

