import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    let title = this.get("#title");
    title.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.save();
      }
    });
    
    let input = this.get("#inputSubject");
    let list = this.get("#subject");
    input.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        // https://derickbailey.com/2016/03/23/get-a-data-attribute-value-from-the-selected-datalist-option/
        var value = input.value;
        // TODO: value could be a literal or a url
        var option = this.get("[value='" + value + "']");
        // value could also be an external url
        if(!option) return;
        let id = option.dataset.url;
        lively.notify('url: ' + id);
      }
    });
    
    let button = this.get('#save');
    button.addEventListener('click', event => this.save());
    
    this.prepareOptions('#subject2');
    this.prepareOptions('#predicate2');
    this.prepareOptions('#object2');
    this.prepareDatalist('#subject');
    this.prepareDatalist('#predicate');
    this.prepareDatalist('#object');
  }
  
  async prepareOptions(listSelector) {
    let graph = Graph.getInstance();
    await graph.loadFromDir('https://lively4/dropbox/');

    let selection = this.get(listSelector);
    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      option.value = knot.url;
      option.text = knot.label();
      
      selection.appendChild(option);
    });
  }
  
  async prepareDatalist(listSelector) {
    let graph = Graph.getInstance();
    await graph.loadFromDir('https://lively4/dropbox/');

    let selection = this.get(listSelector);
    graph.getKnots().forEach(knot => {
      let option = document.createElement('option');
      
      option.innerHTML = knot.label();
      option.value = knot.url;
      option.dataset.url = 123;knot.url;
      
      selection.appendChild(option);
    });
  }
  
  async save() {
    let graph = Graph.getInstance();

    let directory = this.get('#directory').value;
    let title = this.get('#title').value;
    let fileEnding = this.get('#file-ending').value;

    graph.createTriple(
      this.get('#subject2').value,
      this.get('#predicate2').value,
      this.get('#object2').value
    );
  }
}
