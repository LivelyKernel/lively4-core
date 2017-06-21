import Morph from './Morph.js';

import { Graph } from 'src/client/triples/triples.js';

export default class KnotInput extends Morph {
  get listSelector() { return '#list'}
  get input() { return this.get('#input'); }
  get list() { return this.get(this.listSelector); }
  get label() { return this.get('#label'); }

  async initialize() {
    this.windowTitle = "Knot Input";

    this.input.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onEnter();
      }
    });
    
    await this.prepareDatalist();
  }
  
  async prepareDatalist() {
    let graph = Graph.getInstance();
    await graph.loadFromDir('https://lively4/dropbox/');

    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      
      option.innerHTML = knot.label();
      option.value = knot.url;
      option.dataset.url = knot.url;
      
      this.list.appendChild(option);
    });
  }
  
  // https://derickbailey.com/2016/03/23/get-a-data-attribute-value-from-the-selected-datalist-option/
  getURLStringFor(inputSelector, listSelector) {
    var value = this.input.value;
    lively.notify('input value: ' + value);
    // TODO: check for empty value ('')
    // TODO: value could be a literal or a url
    var option = this.get(`${this.listSelector} [value='${value}']`);
    // value could also be an external url
    if(!option) return;
    lively.notify(option.innerHTML)
    let url = option.dataset.url;
    lively.notify('url: ' + url);
    return url;
  }
  
  setLabel(text) { this.label.innerHTML = text; }
  setPlaceholder(text) { this.input.setAttribute('placeholder', text); }
  onEnter() {
    lively.notify(123 + this.getURLStringFor(this.inputSelector, this.listSelector))
  }
}