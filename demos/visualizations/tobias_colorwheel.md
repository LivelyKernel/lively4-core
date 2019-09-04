# Tobias' Color Wheel  v1

<script>

import d3 from 'src/external/d3.v4.js';

// set the dimensions and margins of the graph
var width = 450,
    height = 450,
    margin = 40

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var radius = Math.min(width, height) / 2 - margin

// append the svg object to the div called 'my_dataviz'
var div = document.createElement("div")

var svg = d3.select(div)
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// Create dummy data
var data = {};

  `#e61919
  #f07575
  #7a3d1f
  #b85c2e
  #ff8000
  #ffb366
  #ffff33
  #ffff99
  #4db34d
  #94d194
  #0f618a
  #1791cf
  #8a5095
  #b88bc1
  #f986bf
  #fbb6d9`.split("\n").forEach(ea => data[ea] = 1)


// Compute the position of each group on the pie:
var pie = d3.pie()
  .value(function(d) {return d.value; })
var data_ready = pie(d3.entries(data))

// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
svg
  .selectAll('whatever')
  .data(data_ready)
  .enter()
  .append('path')
  .attr('d', d3.arc()
    .innerRadius(0)
    .outerRadius(radius)
  )
  .attr('fill', function(d){ return(d.data.key) })
  .attr("stroke", "black")
  .style("stroke-width", "0px")
  .style("opacity", 0.7)

 div
</script>