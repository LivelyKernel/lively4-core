import Morph from './Morph.js';

import { Graph } from 'src/client/triples/triples.js';
import { applyDragCSSClass } from 'src/client/draganddrop.js';

export default class KnotInput extends Morph {
  get listSelector() { return '#list'}
  get input() { return this.get('#input'); }
  get list() { return this.get(this.listSelector); }
  get label() { return this.get('#label'); }

  async initialize() {
    this.windowTitle = "Knot Input";

    this.input.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.dispatchEvent(new CustomEvent('enter-knot', { detail: this.getValue() }));
      }
    });
    
    this.input::applyDragCSSClass();
    this.input.addEventListener('drop', evt => {
      if(evt.dataTransfer.types.includes("knot/url")) {
        evt.stopPropagation();
        evt.preventDefault();
        
        this.setValue(evt.dataTransfer.getData("knot/url"));
        this.focus();
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
    let url;
    // TODO: check for empty value ('')
    // TODO: value could be a literal or a url
    
    // check if value is a URL
    try {
      url = new URL(value);
    } catch(e) {
      lively.notify(value + ' is no URL');
      throw e;
    }

    // check if url is known
    var option = this.get(`${this.listSelector} [value='${value}']`);
    if(option) {
      // known URL
      return option.dataset.url;
    } else {
      // check for external url
      return value;
      if(Graph.isExternalURL(url)) {
        
      } else {
        
      }
      throw new Error(`${value} is an external URL. Thus, it probably does not support 'Access-Control-Allow-Origin' header and/or https.`);
    }
  }
  getValue() { return this.input.value; }
  
  setLabel(text) { this.label.innerHTML = text; }
  setPlaceholder(text) { this.input.setAttribute('placeholder', text); }
  setValue(urlString) { this.input.value = urlString; }

  focus() { this.get('#input').focus(); }
  
  livelyExample() {
    this.setLabel("some knot:");
    this.setPlaceholder("knot url");
  }
}