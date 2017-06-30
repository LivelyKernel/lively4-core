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
    let graph = await Graph.getInstance();

    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      
      option.innerHTML = knot.label();
      option.value = knot.url;
      option.dataset.url = knot.url;
      
      this.list.appendChild(option);
    });
  }
  
  // https://derickbailey.com/2016/03/23/get-a-data-attribute-value-from-the-selected-datalist-option/
  getURLString() {
    var value = this.input.value;
    // TODO: check for empty value ('')
    // TODO: value could be a literal or a url
    
    // check if value is a URL
    try {
      new URL(value);
    } catch(e) {
      lively.notify(value + ' is no URL');
      throw e;
    }

    // check for external url
    var option = this.get(`${this.listSelector} [value='${value}']`);
    // value could also be an external url
    if(option) {
      let url = option.dataset.url;
      return url;
    } else {
      throw new Error(`${value} is an external URL. Thus, it probably does not support 'Access-Control-Allow-Origin' header and/or https.`);
    }
  }
  getValue() { return this.input.value; }
  
  setLabel(text) { this.label.innerHTML = text; }
  setPlaceholder(text) { this.input.setAttribute('placeholder', text); }
  setValue(urlString) { this.input.value = urlString; }
  onEnter() {
    lively.notify(123 + this.getURLString());
  }
  
  focus() { this.get('#input').focus(); }
}