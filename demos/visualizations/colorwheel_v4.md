# Tobias' Color Wheel  v4

<script>

import d3 from 'src/external/d3.v5.js';

// set the dimensions and margins of the graph
var width = 200,
    height = 200,
    margin = 5

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var radius = Math.min(width, height) / 2 - margin

// append the svg object to the div called 'my_dataviz'
var div = document.createElement("div")

var svg = d3.select(div)
  .append("svg")
    .attr("width", width * 10)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// Create dummy data
var selected_data= [
 {h:  10,  s:80,  v:50, 	rgb: "#e61919"},
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

var used_v = _.uniq(selected_data.map( ea => ea.v)).sort().reverse()



var data = []
var delta_h = 10
var delta_s = 10

for(var h=0; h<360; h += delta_h) {
  for(var s=0; s<100; s += delta_s) {
    for(var v of used_v) {
      var d = {
        h: h,
        s: s,
        v: v,
      }
      d.marked = selected_data.filter(ea => {
        return (h <= ea.h && ea.h < (h + delta_h))
          && (s <= ea.s && ea.s < (s + delta_s))
          && (v == ea.v)
      })
      data.push(d)
    }
  }
}

function color(d) {
  return d3.hsl(d.h, d.s / 100, d.v / 100).toString()
  // return d3.hsl(...hsv_to_hsl(d.h, d.s / 100, d.v / 100)).toString()
}

var pie = d3.pie()
  .value(function(d) {return 1 })
var pie_data = pie(data)

var colorWheel = svg
  .selectAll('whatever')
  .data(pie_data)
  .enter()
  .append('g')
    .attr("transform", d => {
      var i = used_v.indexOf(d.data.v)
      return "translate(" + (i * (width + 1))  + "," + 0 + ")"
    })
colorWheel.append("text")
  .attr("x", -0.5 * width)
  .attr("y", 0.5 * height)
  .text(d => d.data.v) // #TODO refactor we do this for every element
    
colorWheel.append('path')
  .attr('d', d => d3.arc()
    .innerRadius((d.data.s - delta_s)/ 100 * radius)
    .outerRadius(d.data.s / 100 * radius)
    .startAngle(d.data.h  / 360 * (Math.PI * 2))
    .endAngle((d.data.h + delta_h) / 360 * (Math.PI * 2))() 
  )
  .attr('fill', (d) => {
    if (d.data.marked.length > 0) {
      return d.data.marked[0].rgb
      // return color(d.data.marked[0])
     } else {
      return color(d.data)
     }
  })
  .attr("stroke", "black")
  .style("stroke-width", (d) => d.data.marked.length > 0 ? "1px" : "0px")
  .style("opacity", 1)


 div
</script>