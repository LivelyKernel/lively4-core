"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import loadDropbox, { Graph } from 'src/client/triples/triples.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { copyTextToClipboard } from 'utils';

// add hint for focus
const style = document.querySelector('#highlight-focus') || <style id="highlight-focus" type="text/css"></style>;
style.innerHTML = `
:focus-within {
    outline: dashed red
    }
:focus {
    outline: dashed yellow 3px;
    }
`;
document.head.appendChild(style);

export default class KnotCopyViewer extends Morph {
  get multiSelection() {
    return this._multiSelection = this._multiSelection || new MultiSelection(this, {
      onSelectionChanged: selection => selection.first.onSelect(),
    });
  }

  async initialize() {
    this.windowTitle = "KnotCopyViewer";

    this.registerButtons();
    lively.html.registerKeys(this);

    await this.loadGraph();
    await lively.sleep(0)
    this.parentNode.focus()
  }

  get list() {
    return this.get("#list");
  }
  get editor() {
    return this.get('#editor');
  }

  focus() {
    this.multiSelection.focus();
  }

  async loadGraph() {
    let graph = await Graph.getInstance();

    this.innerHTML = '';
    graph.knots.sortBy(knot => knot.label()).filter(knot => knot.url.endsWith("md") && !knot.label().startsWith("Research-Diary")).forEach((knot, index) => {
      let listItem = <li><input></input></li>;
      listItem.innerHTML = knot.label();
      listItem.onSelect = () => {
        this.selectKnot(knot, listItem, index);
      };
      //       listItem.setAttribute("contenteditable", true)
      //       listItem.setAttribute("tabindex", 1);
      //       listItem.addEventListener("click", function() {
      //     debugger
      //         this.focus();
      //         lively.notify(123)
      //       });
      //       listItem.addEventListener("focus", async (e) => {
      //     debugger
      //         this.selectKnot(knot, listItem, index);
      //         e.stopPropagation();
      //         e.preventDefault();
      //       });
      //       listItem.addEventListener("keydown", async () => {
      //         lively.notify('fooo');
      //       });
      this.multiSelection.addItem(listItem);
      this.list.appendChild(listItem);
    });

    this.selectIndex(this.index);
  }

  async selectKnot(knot, item, index) {
    lively.notify(`select ${knot.label()}`);
    this.knot = knot;
    this.item = item;
    this.index = index;

    const content = `${knot.content}




`;
    this.editor.value = content;
    copyTextToClipboard(content);
    
    await lively.sleep(0)
    this.parentNode.focus()
  }

  selectIndex(index) {
    const item = this.list.childNodes[index !== undefined ? index : 0];
    this.multiSelection.selectItem(item);
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    debugger;
    lively.notify("Key Down!" + evt.charCode);
  }

  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) + 1;
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  /* Lively-specific API */

  livelyMigrate(other) {
    this.index = other.index;
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    //this.someJavaScriptProperty = other.someJavaScriptProperty
  }
}