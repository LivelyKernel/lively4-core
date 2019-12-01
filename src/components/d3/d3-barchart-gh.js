import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
/*MD # D3 Barchart (Simple)

![](d3-barchart-gh.png){height=300px}

MD*/

export default class D3BarchartGh extends Morph {
  constructor() {
    super();
    this.width = this.get('#svg').svgElement.clientWidth;
    this.height = this.get('#svg').svgElement.clientHeight;
    
  }

  getData() {
    if (!this.data) {
      this.data = [
        { Name: 'a', Value: 10 },
        { Name: 'b', Value: 15 },
        { Name: 'c', Value: 12 },
      ];
    }
    return this.data
  }
  
  setData(data) {
    this.data = data;
    this.updateViz()
  }
  
  async initialize() {   
    this.updateViz()
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  updateViz() {
   this.getData();

     this.get('#svg').innerHTML = '';

     const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const svgElement = this.get('#svg');
    const width = this.width - margin.left - margin.right;
    const height = this.height - margin.top - margin.bottom;

     const svg = d3.select(svgElement)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')

       .attr('transform', 
          'translate(' + margin.left + ',' + margin.top + ')');

     var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
    var y = d3.scaleLinear()
              .range([height, 0]);


     x.domain(this.data.map(function(d) { return d.Name; }));
    y.domain([0, d3.max(this.data, function(d) { return d.Value; })]);

     svg.selectAll(".bar")
        .data(this.data)
        .enter().append("rect")
        .style("fill", "steelblue")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.Name); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.Value); })
        .attr("height", function(d) { return height - y(d.Value); });

     svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

     svg.append("g")
        .call(d3.axisLeft(y));
    
  }
  
  async livelyExample() {
    this.setData([
      { Name: 'a', Value: 10 },
      { Name: 'b', Value: 15 },
      { Name: 'c', Value: 12 },
    ]);
  }
  
  livelyMigrate(other) {
    this.data = other.data
  }
  
}
