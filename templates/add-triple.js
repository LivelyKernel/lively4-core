import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    this.spo.forEach(({ selector, label, placeholder }) => {
      let input = this.get(selector);
      input.setLabel(label);
      input.setPlaceholder(placeholder);
      input.onEnter = () => this.save();
    });
  }
  
  /** subject, predicate, object */
  get spo() {
    return [{
      label: 'Subject',
      placeholder: 'subject',
      input: '#inputSubject',
      list: '#subject',
      debugLabel: 'subject',
      selector: '#subject2'
    }, {
      label: 'Predicate',
      placeholder: 'predicate',
      input: '#inputPredicate',
      list: '#predicate',
      debugLabel: 'predicate',
      selector: '#predicate2'
    }, {
      label: 'Object',
      placeholder: 'object',
      input: '#inputObject',
      list: '#object',
      debugLabel: 'object',
      selector: '#object2'
    }]
  }
  
  async prepareDatalist(listSelector) {
    let graph = Graph.getInstance();
    await graph.loadFromDir('https://lively4/dropbox/');

    let list = this.get(listSelector);
    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      
      option.innerHTML = knot.label();
      option.value = knot.url;
      option.dataset.url = knot.url;
      
      list.appendChild(option);
    });
  }
  
  // https://derickbailey.com/2016/03/23/get-a-data-attribute-value-from-the-selected-datalist-option/
  getURLStringFor(inputSelector, listSelector) {
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
    this.spo.forEach(({ selector, debugLabel }) => {
      if(this.get(selector).getValue() === '') {
        lively.notify(`${debugLabel} not specified!`, null, 2, null, 'red');
        throw new RangeError(`No ${debugLabel} specified in Add Triple.`);
      }
    });
    
    const subjectURLString = this.get('#subject2').getURLStringFor();
    const predicateURLString = this.get('#predicate2').getURLStringFor();
    const objectURLString = this.get('#object2').getURLStringFor();
    
    let graph = Graph.getInstance();
    graph.createTriple(
      subjectURLString,
      predicateURLString,
      objectURLString
    );
  }
}
