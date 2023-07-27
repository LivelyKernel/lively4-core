import Morph from "src/components/widgets/lively-morph.js"
import D3Component from "./d3-component.js"
import d3v3 from "src/external/d3.v3.js"

import { debounce } from "utils";
import "src/external/d3-selection-multi.v1.js"

export default class D3BarChart extends D3Component {

  async initialize() {
    return this.updateViz()
    this.options = this.options || {}
    this.loaded = new Promise(async (resolve) => {
      this.updateViz()
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      resolve()
    })
    
    this.zoom = false
  }
  
  async updateViz() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"

    var bounds = this.getBoundingClientRect()
    this.get("svg").innerHTML = ""

    return this.scatterPlot();
    
    
    // svgContainer.style.height = this.style.height
    
    
    var treeData = this.getData()
    if (!treeData) return; // nothing to render

    var margin = { top: 20, right: 20, bottom: 20, left: 40 }
    var width = bounds.width;
    var height = bounds.height;
    
    var data = this.getData();
    if (!data) return;// nothing to to

    var width = lively.getExtent(this).x - 30
    
    var x = d3v3.scaleLinear()
        .domain([0, d3v3.max(data, d => d.x1)])
        .range([0, width]);

    var lineHeight = 20
    
    var y =  d3v3.scaleBand()
      .domain(data.map((ea, i) => i))
      .range([0, lineHeight * data.length]);
    y.paddingInner(0.1);    
    
    var svgOuter = d3v3.select(this.get("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
    
    if (this.zoom) {
      svgOuter.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3v3.zoom()
            .scaleExtent([1 / 4, 20])
            .on("zoom", () => {
              zoomG.attr("transform", d3v3.event.transform);
            }));      
    }
    
    
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
    var dataWidth = d =>  Math.max(2, x(d.x1 - d.x0)) + "px"
    
    var rect = node.append("rect")
        .attr("x", dataX)
        .attr("y", dataY)
        .attr("height", dataHeight)
        .attr("width", dataWidth)
        .attr("fill", d =>  this.dataColor(d))
    
    // first level of children
    node.each(function(parentData, parentIndex) {
      var eachNode = d3v3.select(this);
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
                vis.onNodeClick(d, d3v3.event, this)
            })
            .append("title")
              .text(d => vis.dataTitle(d)); 
    })
 
    rect.append("title")
       .text(d => this.dataTitle(d));  
    
    rect.on("click", function(d) {
        vis.onNodeClick(d, d3v3.event, this) 
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
        .text(d => this.dataLabel(d));
    
      label.append("title")
       .text(d => this.dataTitle(d));  

      var xAxis = d3v3.axisBottom(x);
      var xAxisGroup = svg.append("g").call(xAxis);
      xAxisGroup.attr("transform", `translate(0, ${y(data.length - 1) + lineHeight})`)

      // we cannot zoom... so we grow ourself
      if (!this.zoom) {
        var yAxisHeight = lineHeight // guess
        var chartHeight = (y(data.length - 1) +  lineHeight) + yAxisHeight
        svgContainer.style.height =  margin.top +  chartHeight + margin.bottom + "px"
      }
    
      var yAxis = d3v3.axisLeft(y)
    
      var yAxisGroup = svg.append("g").call(yAxis);
      
      
    
      if (!this.zoom) {
        this.style.height = dataHeight() + "px"
      }
  }

  scatterPlot() {
var        size = 130,
        padding = 10;

    var x = d3v3.scale.linear()
    .range([padding / 2, size - padding / 2]);

    var y = d3v3.scale.linear()
    .range([size - padding / 2, padding / 2]);

    var xAxis = d3v3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(6);
    
    var yAxis = d3v3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(6);

    var color = d3v3.scale.category10();

    d3v3.csv(lively4url + '/demos/stefan/tools-4-games/games.csv', function(d) {
  var row = {};
  for (var prop in d) {
    row[prop] = isNaN(+d[prop]) ? d[prop] : +d[prop];
  }
  return row;
}, (error, data) => {
      if (error) throw error;

      var domainByTrait = {},
          traits = d3v3.keys(data[0]).filter(function(d) { return !["branch"].includes(d); }),
          n = traits.length;

      traits.forEach(function(trait) {
        domainByTrait[trait] = d3v3.extent(data, function(d) { return d[trait]; });
      });

      xAxis.tickSize(size * n);
      yAxis.tickSize(-size * n);

      var brush = d3v3.svg.brush()
      .x(x)
      .y(y)
      .on("brushstart", brushstart)
      .on("brush", brushmove)
      .on("brushend", brushend);

      var svg = d3v3.select(this.get("svg"))
      .attr("width", size * n + padding)
      .attr("height", size * n + padding)
      .append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

      svg.selectAll(".x.axis")
        .data(traits)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
        .each(function(d) { x.domain(domainByTrait[d]); d3v3.select(this).call(xAxis); });

      svg.selectAll(".y.axis")
        .data(traits)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { y.domain(domainByTrait[d]); d3v3.select(this).call(yAxis); });

      var cell = svg.selectAll(".cell")
      .data(cross(traits, traits))
      .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

      // Titles for the diagonal.
      cell.filter(function(d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

      cell.call(brush);

      function plot(p) {
        var cell = d3v3.select(this);

        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);

        cell.append("rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

        cell.selectAll("circle")
          .data(data)
          .enter().append("circle")
          .attr("cx", function(d) { return x(d[p.x]); })
          .attr("cy", function(d) { return y(d[p.y]); })
          .attr("r", 4)
          .style("fill", function(d) { return color(d.iteration); })
      }

      var brushCell;

        var info = this.get('#info')
      function showProjects(projects) {
        info.innerHTML = ''
        const circles = projects.first;
        const branches = circles.map(c => c.__data__.branch).uniq()
        info.append(...branches.map(b => <div>{b}</div>))
      }
      // Clear the previously-active brush, if any.
      function brushstart(p) {
        if (brushCell !== this) {
          d3v3.select(brushCell).call(brush.clear());
          x.domain(domainByTrait[p.x]);
          y.domain(domainByTrait[p.y]);
          brushCell = this;
        }
      }

      // Highlight the selected circles.
      function brushmove(p) {
        var e = brush.extent();
        svg.selectAll("circle").classed("hidden", function(d) {
          return e[0][0] > d[p.x] || d[p.x] > e[1][0]
          || e[0][1] > d[p.y] || d[p.y] > e[1][1];
        });
        const projects = svg.selectAll("circle").filter(function(d) {
          return !(e[0][0] > d[p.x] || d[p.x] > e[1][0]
          || e[0][1] > d[p.y] || d[p.y] > e[1][1])
        });
        showProjects(projects)
      }

      // If the brush is empty, select all circles.
      function brushend() {
        if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
      }
    });

    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }
  }
  onExtentChanged() {
    this.updateViz()
  }

  async livelyExample() {
    return;
  }
  
  livelyMigrate(other) {
    return;
  }

}



