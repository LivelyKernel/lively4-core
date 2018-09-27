import d3 from 'src/external/d3.v4.js';

export default function d3visualize({ path, state, t, template, traverse }) {
  
  if(!window.visTarget || visTarget.tagName !== "DIV") { lively.notify("no vis"); return; }
  visTarget.innerHTML = "";
  
  const width = visTarget.clientWidth;
  const height = visTarget.clientHeight;
  
  const svg = d3.select(visTarget).append("svg");
  const graphContainer = svg.append("g");
  const zoomer = graphContainer.append("g");
  svg
    .attr("width", width)
    .attr("height", height);
  
  svg.call(d3.zoom()
			.duration(150)
    	//.scaleExtent([MIN_MAGNIFICATION, MAX_MAGNIFICATION])
      .on("zoom", () => graphContainer.attr("transform", d3.event.transform)));
  
  const astNodes = [];
  path.traverse({
    Identifier(path) {
      astNodes.push(path.node);
    }
  })
  lively.notify(astNodes.length);
  const astNodeContainer = zoomer.append("g");
  const nodes = astNodeContainer.selectAll("g")
    .data(astNodes).enter()
      .append("g")
      .attr("transform", d => {
        const x = d && d.loc && d.loc.start && d.loc.start.column || 0;
        const y = d && d.loc && d.loc.start && d.loc.start.line || 0;
        return `translate(${x}, ${y})`;
      });
  nodes.append("circle")
      .attr("r", 0.5)
      .style('fill', 'white')
  nodes.append("text")
       .style("text-anchor", "middle")
       .style("alignment-baseline", "middle")
       .style("font-size", "0.5px")
       .text(d => d.name);
  const contentBox = svg.node().getBBox();
  zoomer.attr("transform", `translate(${-contentBox.x/2}, ${-contentBox.y/2})scale(${width/contentBox.width}, ${height/contentBox.height})`)
}
