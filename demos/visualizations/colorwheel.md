# Tobias' Color Wheel  v2

<script>

import d3 from 'src/external/d3.v5.js';

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
var tobias_data = [
 {h:  0,  s:80,  v:50, 	rgb: "#e61919"},
 {h:   0, s: 80, v:70, 	rgb: "#f07575"},
 {h:  20, s: 60, v:30, 	rgb: "#7a3d1f"},
 {h:  20, s: 60, v:45, 	rgb: "#b85c2e"},
 {h:  30, s:100, v:50, 	rgb: "#ff8000"},
 {h:  30, s:100, v:70, 	rgb: "#ffb366"},
 {h:  60, s:100, v:60, 	rgb: "#ffff33"},
 {h:  60, s:100, v:80, 	rgb: "#ffff99"},
 {h: 120, s: 40, v:50, 	rgb: "#4db34d"},
 {h: 120, s: 40, v:65, 	rgb: "#94d194"},
 {h: 200, s: 80, v:30, 	rgb: "#0f618a"},
 {h: 200, s: 80, v:45, 	rgb: "#1791cf"},
 {h: 290, s: 30, v:45, 	rgb: "#8a5095"},
 {h: 290, s: 30, v:65, 	rgb: "#b88bc1"},
 {h: 330, s: 90, v:75, 	rgb: "#f986bf"},
 {h: 330, s: 90, v:85, 	rgb: "#fbb6d9"}]

var data = []

for(var h=0; h<360; h +=1) {
  data.push({
    h: h,
    s: 100,
    v: 40,
  })
}



var pie = d3.pie()
  .value(function(d) {return 1 })
var pie_data = pie(data)

svg
  .selectAll('whatever')
  .data(pie_data)
  .enter()
  .append('path')
  .attr('d', d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius)
  )
  .attr('fill', function(d){ return d3.color(d3.hsl(d.data.h,d.data.s/ 100, d.data.v / 100))  })
  .attr("stroke", "black")
  .style("stroke-width", function(d){ 
    if (tobias_data.find(ea => ea.h == d.data.h)) {
      return "2px"
    } else {
      return "0px"
    }
  })
  .style("opacity", 0.7)

 div
</script>