<script>
import d3 from 'src/external/d3.v4.js';

var width = 450,
    height = 450,
    margin = 40

var div = document.createElement("div")

var svg = d3.select(div)
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  
var rectangle = svgContainer.append("rect")
  .attr("x",150)
  .attr("y",50)
  .attr("width",50)
  .attr("height",140);
  .style("fill", "#69b3a2");

</script>