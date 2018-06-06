"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v4.js';

export default class D3Example extends Morph {  
  constructor() {
    super();
    this.initialize();
  }
  
  async initialize() {
    this.windowTitle = "D3Example";
    this._svg = this.shadowRoot.querySelector('#svgContainer');
    this._nodes = [];
    this._links = [];
  }
  
  get svg() {
    return this._svg;
  }
  
  draw() {
    const svg = d3.select(this.svg);
    svg.selectAll("*").remove();

    const width = svg.attr("width");
    const height = svg.attr("height");

    const graph = {
        nodes: this._nodes,
        links: this._links
    };

    const link = svg.selectAll()
            .data(graph.links)
            .enter()
            .append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', '5px');

    const node = svg.selectAll()
            .data(graph.nodes)
            .enter()
            .append("g")
            .call(d3.drag()
                  .on('start', dragstarted)
                  .on('drag', dragged)
                  .on('end', dragended));
    
    node
      .append('circle')
      .attr('r', 50)
      .attr('fill', 'red')
      .attr('stroke', 'black')
      .attr('stroke-width', '5px');

    const simulation = d3.forceSimulation()
              .force('link', d3.forceLink().distance(width / 2))
              .force('charge', d3.forceManyBody())
              .force('centerX', d3.forceX(width / 2))
              .force('centerY', d3.forceY(height / 2));

    simulation
        .nodes(graph.nodes)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(graph.links);

    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
  }
  
  example1() {
    const data = [
      {hash: "324dwqad3we"},
      {hash: "qwf3q4wfqwa"},
      {hash: "nw8fqodwewq"},
      {hash: "slnfiewolsd"},
      {hash: "09hjqwbdv8q"}
    ];
    let counter = 1;
    data.forEach(element => {
      const group = d3.select(this._svg)
        .append('g')
          .attr('class', 'node');
      group.append('circle')
        .attr('cx', 50*counter)
        .attr('cy', 50*counter);
      group.append('text')
        .text(element.hash)
        .attr('x', 50*counter + 15)
        .attr('y', 50*counter + 7);
      counter += 1;
    });
  }
  
  example2() {
    this._nodes = [
      {}, {}, {}, {}, {}, {}
    ];
    
    this._links = [
      {source: 0, target: 1},
      {source: 1, target: 2},
      {source: 2, target: 3},
      {source: 4, target: 5},
      {source: 5, target: 0}
    ];
    
    this.draw();
  }
  
  async livelyExample() {
      this.example2();
  }
}