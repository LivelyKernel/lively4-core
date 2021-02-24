"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import loadDropbox, { Graph } from 'src/client/triples/triples.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import {copyTextToClipboard} from 'utils';

export default class KnotCopyViewer extends Morph {
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(this);
  }
  
  async initialize() {
    this.windowTitle = "KnotCopyViewer";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    
  
    await this.loadGraph()
  }
  
  get list(){
    return this.get("#list")
  }
  
  async loadGraph() {
    let graph = await Graph.getInstance();
    
    graph.knots
      .filter(knot => knot.url.endsWith("md")&&!knot.label().startsWith("Research-Diary"))
      .forEach((knot, index) => {
        let listItem = <li tabindex="0"></li>;
        listItem.innerHTML = knot.label();
        listItem.setAttribute("tabindex", "0");
        listItem.addEventListener("focus", async () => {
          this.showKnot(knot, listItem);
        });
        listItem.addEventListener("keydown", async () => {
          lively.notify('fooo')
        });
        this.appendChild(listItem);
      });
  }
  
  showKnot(knot, item){
    this.knot=knot;
    this.item=item;
    let editorComp = this.get('#editor');
    editorComp.value = knot.content;
    copyTextToClipboard(`${knot.content}

`)
    lively.notify(knot.label())
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) + 1
  }
  
  onMinusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) - 1
  }

  /* Lively-specific API */

    
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    //this.someJavaScriptProperty = other.someJavaScriptProperty
  }
}