import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js';

export default class D3Bubblechart extends Morph {
  getData() {
    if (!this.data) {
      this.data = {
        children: [
          { Name: 'Olives', Value: 4319 },
          { Name: 'Tea', Value: 4159 },
          { Name: 'Mashed Potatoes', Value: 2583 },
          { Name: 'Boiled Potatoes', Value: 2074 },
          { Name: 'Milk', Value: 1894 },
          { Name: 'Chicken Salad', Value: 1809 },
          { Name: 'Vanilla Ice Cream', Value: 1713 },
          { Name: 'Cocoa', Value: 1636 },
          { Name: 'Lettuce Salad', Value: 1566 },
          { Name: 'Lobster Salad', Value: 1511 },
          { Name: 'Chocolate', Value: 1489 },
          { Name: 'Apple Pie', Value: 1487 },
          { Name: 'Orange Juice', Value: 1423 },
          { Name: 'American Cheese', Value: 1372 },
          { Name: 'Green Peas', Value: 1341 },
          { Name: 'Assorted Cakes', Value: 1331 },
          { Name: 'French Fried Potatoes', Value: 1328 },
          { Name: 'Potato Salad', Value: 1306 },
          { Name: 'Baked Potatoes', Value: 1293 },
          { Name: 'Roquefort', Value: 1273 },
          { Name: 'Stewed Prunes', Value: 1268 },
        ],
      };
    }
    return this.data;
  }

  setData(data) {
    this.data = data;
    this.updateViz();
  }

  async initialize() {
    this.updateViz();
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  updateViz() {
    this.getData();
    this.get('#svg').innerHTML = '';
    const diameter = 600;
    const color = d3.scaleOrdinal("schemeCategory20");

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const svgElement = this.get('#svg');
    const width = this.width;
    const height = this.height;
    const bubble = d3
      .pack(this.data)
      .size([width, height])
      .padding(1.5);

    const svg = d3
      .select(svgElement)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('class', 'bubble');

    const nodes = d3.hierarchy(this.data).sum(d => d.Value);

    const node = svg
      .selectAll('.node')
      .data(bubble(nodes).descendants())
      .enter()
      .filter(d => !d.children)
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    
    node.append('title').text(d => d.data.Name + ': ' + d.data.Value);

    node
      .append('circle')
      .attr('r', d => d.r)
      .style('fill', (d,i) => color(i));

    node
      .append('text')
      .attr('dy', '.2em')
      .style('text-anchor', 'middle')
      .text(d => String(d.data.Name).substring(0, 18))
      .attr('font-family', 'sans-serif')
      .attr('font-size', d => d.r / 5)
      .attr('fill', 'white');

    node
      .append('text')
      .attr('dy', '1.3em')
      .style('text-anchor', 'middle')
      .text(d => d.data.Value)
      .attr('font-family', 'Gill Sans', 'Gill Sans MT')
      .attr('font-size', d => d.r / 5)
      .attr('fill', 'white');
  }

  async livelyExample() {
    this.setData({
      children: [
        { Name: 'Olives', Value: 4319 },
        { Name: 'Tea', Value: 4159 },
        { Name: 'Mashed Potatoes', Value: 2583 },
        { Name: 'Boiled Potatoes', Value: 2074 },
        { Name: 'Milk', Value: 1894 },
        { Name: 'Chicken Salad', Value: 1809 },
        { Name: 'Vanilla Ice Cream', Value: 1713 },
        { Name: 'Cocoa', Value: 1636 },
        { Name: 'Lettuce Salad', Value: 1566 },
        { Name: 'Lobster Salad', Value: 1511 },
        { Name: 'Chocolate', Value: 1489 },
        { Name: 'Apple Pie', Value: 1487 },
        { Name: 'Orange Juice', Value: 1423 },
        { Name: 'American Cheese', Value: 1372 },
        { Name: 'Green Peas', Value: 1341 },
        { Name: 'Assorted Cakes', Value: 1331 },
        { Name: 'French Fried Potatoes', Value: 1328 },
        { Name: 'Potato Salad', Value: 1306 },
        { Name: 'Baked Potatoes', Value: 1293 },
        { Name: 'Roquefort', Value: 1273 },
        { Name: 'Stewed Prunes', Value: 1268 },
      ],
    });
  }

  livelyMigrate(other) {
    this.data = other.data;
  }
}
