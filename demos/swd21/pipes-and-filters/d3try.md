<div id="view">
</div>

<script>
import d3 from 'src/external/d3.v4.js';

var width = 450,
    height = 450,
    margin = 5

var div = document.createElement("div")
var target = this.parentElement;

var svg = d3.select(target)
  .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    
  
var rectangle = svg.append("rect")
  .attr("x",0)
  .attr("y",50)
  .attr("width",150)
  .attr("height",150)
  .style("fill", "#69b3a2");

rectangle.append("text")
    .attr("x", 1)
    .attr("y", 1)
    .attr("dy", 2)
    .text("hi");
</script>