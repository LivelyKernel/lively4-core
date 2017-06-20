import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    let input = this.get("#inputSubject");
    this.selectors.forEach(({ input }) => this.get(input).addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.save();
      }
    }));
    
    let button = this.get('#save');
    button.addEventListener('click', event => this.save());
    
    this.selectors.forEach(({ list }) => this.prepareDatalist(list));
  }
  
  /** subject, predicate, object */
  get spo() { return this.selectors; }
  
  get selectors() {
    return [{
      input: '#inputSubject',
      list: '#subject',
      debugLabel: 'subject'
    }, {
      input: '#inputPredicate',
      list: '#predicate',
      debugLabel: 'predicate'
    }, {
      input: '#inputObject',
      list: '#object',
      debugLabel: 'object'
    }]
  }
  
  async prepareDatalist(listSelector) {
    let graph = Graph.getInstance();
    await graph.loadFromDir('https://lively4/dropbox/');

    let selection = this.get(listSelector);
    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      
      option.innerHTML = knot.label();
      option.value = knot.url;
      option.dataset.url = knot.url;
      
      selection.appendChild(option);
    });
  }
  
  // https://derickbailey.com/2016/03/23/get-a-data-attribute-value-from-the-selected-datalist-option/
  getURLFor(inputSelector, listSelector) {
    let input = this.get(inputSelector);
    let list = this.get(listSelector);
    
    var value = input.value;
    lively.notify('input value: ' + value);
    // TODO: check for empty value ('')
    // TODO: value could be a literal or a url
    var option = this.get(`${listSelector} [value='${value}']`);
    // value could also be an external url
    if(!option) return;
    lively.notify(option.innerHTML)
    let url = option.dataset.url;
    lively.notify('url: ' + url);
    return url;
  }
  
  async save() {
    let graph = Graph.getInstance();

    const subjectURL = this.getURLFor('#inputSubject', '#subject');
    const predicateURL = this.getURLFor('#inputPredicate', '#predicate');
    const objectURL = this.getURLFor('#inputObject', '#object');
    
    graph.createTriple(
      subjectURL,
      predicateURL,
      objectURL
    );
  }
}
