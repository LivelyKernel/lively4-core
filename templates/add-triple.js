import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    let subject = this.get('#subject2');
    subject.setLabel('Subject')
    
    this.spo.forEach(({ input }) => this.get(input).addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.save();
      }
    }));
    
    this.spo.forEach(({ list }) => this.prepareDatalist(list));
  }
  
  /** subject, predicate, object */
  get spo() {
    return [{
      input: '#inputSubject',
      list: '#subject',
      debugLabel: 'subject',
      selector: '#subject2'
    }, {
      input: '#inputPredicate',
      list: '#predicate',
      debugLabel: 'predicate',
      selector: '#predicate2'
    }, {
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
    let graph = Graph.getInstance();

    this.spo.forEach(({ input, debugLabel }) => {
      if(this.get(input).value === '') {
        lively.notify(`${debugLabel} not specified!`, null, 2, null, 'red');
        throw new RangeError(`No ${debugLabel} specified in Add Triple.`);
      }
    });
    
    const subjectURLString = this.getURLStringFor('#inputSubject', '#subject');
    const predicateURLString = this.getURLStringFor('#inputPredicate', '#predicate');
    const objectURLString = this.getURLStringFor('#inputObject', '#object');
    
    graph.createTriple(
      subjectURLString,
      predicateURLString,
      objectURLString
    );
  }
}
