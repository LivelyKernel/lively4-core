import Morph from './Morph.js';

export default class KnotInput extends Morph {
  async initialize() {
    this.windowTitle = "Knot Input";

    this.get('#input').addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onEnter();
      }
    });
    
    this.prepareDatalist('#list');
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
  setLabel(text) {}
  setPlaceholder(text) {
    
  }
  onEnter() {}
}