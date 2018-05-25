"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js';

export default class D3Example extends Morph {  
  constructor() {
    super();
    this.initialize();
  }
  
  async initialize() {
    this.windowTitle = "D3Example";
    this._svg = this.shadowRoot.querySelector('#svgContainer');
  }
  
  get svg() {
    return this._svg;
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
    const data = [
      {hash: "324dwqad3we"},
      {hash: "qwf3q4wfqwa"},
      {hash: "nw8fqodwewq"},
      {hash: "slnfiewolsd"},
      {hash: "09hjqwbdv8q"}
    ];
  }
  
  async livelyExample() {
      this.example1();
  }
}