import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js';

export default class D3Bubblechart extends Morph {
  getData() {
    if (!this.data) {
      this.data = {
        children: [
          { Name: 'Olives', Count: 4319 },
          { Name: 'Tea', Count: 4159 },
          { Name: 'Mashed Potatoes', Count: 2583 },
          { Name: 'Boiled Potatoes', Count: 2074 },
          { Name: 'Milk', Count: 1894 },
          { Name: 'Chicken Salad', Count: 1809 },
          { Name: 'Vanilla Ice Cream', Count: 1713 },
          { Name: 'Cocoa', Count: 1636 },
          { Name: 'Lettuce Salad', Count: 1566 },
          { Name: 'Lobster Salad', Count: 1511 },
          { Name: 'Chocolate', Count: 1489 },
          { Name: 'Apple Pie', Count: 1487 },
          { Name: 'Orange Juice', Count: 1423 },
          { Name: 'American Cheese', Count: 1372 },
          { Name: 'Green Peas', Count: 1341 },
          { Name: 'Assorted Cakes', Count: 1331 },
          { Name: 'French Fried Potatoes', Count: 1328 },
          { Name: 'Potato Salad', Count: 1306 },
          { Name: 'Baked Potatoes', Count: 1293 },
          { Name: 'Roquefort', Count: 1273 },
          { Name: 'Stewed Prunes', Count: 1268 },
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

  updateViz() {
    this.getData();
    this.get('#svg').innerHTML = '';

    const diameter = 600;
    const color = d3.scaleOrdinal(d3.schemeCategory20);

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const svgElement = this.get('#svg');
    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;

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

    const nodes = d3.hierarchy(this.data).sum(d => d.Count);

    const node = svg
      .selectAll('.node')
      .data(bubble(nodes).descendants())
      .enter()
      .filter(d => !d.children)
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    node.append('title').text(d => d.Name + ': ' + d.Count);

    node
      .append('circle')
      .attr('r', d => d.r)
      .style('fill', (d, i) => color(i));

    node
      .append('text')
      .attr('dy', '.2em')
      .style('text-anchor', 'middle')
      .text(d => d.data.Name.substring(0, d.r / 3))
      .attr('font-family', 'sans-serif')
      .attr('font-size', d => d.r / 5)
      .attr('fill', 'white');

    node
      .append('text')
      .attr('dy', '1.3em')
      .style('text-anchor', 'middle')
      .text(d => d.data.Count)
      .attr('font-family', 'Gill Sans', 'Gill Sans MT')
      .attr('font-size', d => d.r / 5)
      .attr('fill', 'white');
  }

  async livelyExample() {
    this.setData({
      children: [
        { Name: 'Olives', Count: 4319 },
        { Name: 'Tea', Count: 4159 },
        { Name: 'Mashed Potatoes', Count: 2583 },
        { Name: 'Boiled Potatoes', Count: 2074 },
        { Name: 'Milk', Count: 1894 },
        { Name: 'Chicken Salad', Count: 1809 },
        { Name: 'Vanilla Ice Cream', Count: 1713 },
        { Name: 'Cocoa', Count: 1636 },
        { Name: 'Lettuce Salad', Count: 1566 },
        { Name: 'Lobster Salad', Count: 1511 },
        { Name: 'Chocolate', Count: 1489 },
        { Name: 'Apple Pie', Count: 1487 },
        { Name: 'Orange Juice', Count: 1423 },
        { Name: 'American Cheese', Count: 1372 },
        { Name: 'Green Peas', Count: 1341 },
        { Name: 'Assorted Cakes', Count: 1331 },
        { Name: 'French Fried Potatoes', Count: 1328 },
        { Name: 'Potato Salad', Count: 1306 },
        { Name: 'Baked Potatoes', Count: 1293 },
        { Name: 'Roquefort', Count: 1273 },
        { Name: 'Stewed Prunes', Count: 1268 },
      ],
    });
  }

  livelyMigrate(other) {
    this.data = other.data;
  }
}
