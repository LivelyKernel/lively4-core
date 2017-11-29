import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    this.spo.forEach(({ selector, label, placeholder }) => {
      let input = this.get(selector);
      input.setLabel(label);
      input.setPlaceholder(placeholder);
      input.addEventListener('enter-knot', () => this.save());
    });
    
    this.prepareDatalist();
  }
  
  async prepareDatalist() {
    const selection = this.get('#knowledge-base-selection');
    const graph = await Graph.getInstance();
    const knowledgeBases = await graph.getRootKnowledgeBases();

    knowledgeBases.forEach(knowledgeBase => {
      let option = document.createElement('option');
      
      option.innerHTML =  knowledgeBase;
      option.value = knowledgeBase;
      option.dataset.url = knowledgeBase;
      
      selection.appendChild(option);
    });
  }
  
  /** subject, predicate, object */
  get spo() {
    return [{
      label: 'Subject',
      placeholder: 'subject',
      debugLabel: 'subject',
      selector: '#subject'
    }, {
      label: 'Predicate',
      placeholder: 'predicate',
      debugLabel: 'predicate',
      selector: '#predicate'
    }, {
      label: 'Object',
      placeholder: 'object',
      debugLabel: 'object',
      selector: '#object'
    }]
  }
  
  focus(id = 'subject') { this.get('#' + id).focus(); }
  
  setField(id, urlString) {
    let knotInput = this.get('#' + id);
    knotInput.setValue(urlString);
  }
  async save() {
    this.spo.forEach(({ selector, debugLabel }) => {
      if(this.get(selector).getValue() === '') {
        lively.notify(`${debugLabel} not specified!`, null, 2, null, 'red');
        throw new RangeError(`No ${debugLabel} specified in Add Triple.`);
      }
    });
    
    const knowledgeBaseURLString = this.get('#knowledge-base-selection').value;
    
    const subjectURLString = this.get('#subject').getURLString();
    const predicateURLString = this.get('#predicate').getURLString();
    const objectURLString = this.get('#object').getURLString();
    
    let graph = await Graph.getInstance();
    let triple = await graph.createTriple(
      subjectURLString,
      predicateURLString,
      objectURLString,
      knowledgeBaseURLString
    );

    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(triple.url);

    this.afterSubmit(triple)
  }
  
  // TODO: employ nice event-based approach or AOP/COP
  afterSubmit(triple) {}
}
