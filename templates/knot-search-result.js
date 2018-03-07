import Morph from 'src/components/widgets/lively-morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { uuid as generateUUID, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';
import Keys from 'src/client/keys.js';
import MultiSelection from 'src/client/vivide/multiselection.js';

export default class KnotSearchResult extends Morph {
  // lazy initializer for knot array
  get knots() { return this._knots = this._knots || []; }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(this);
  }
  
  get searchTerm() { return this.get("#search-term");}
  
  async initialize() {
    this.windowTitle = "KnotSearchResult";
  }
  
  focus() {
    this.multiSelection.focus();
  }

  setSearchTerm(term) {
    this.searchTerm.innerHTML = term;
  }
  
  async addKnot(knot) {
    this.knots.push(knot);
    const list = this.get("#result-list");
    const listItem = knot.toListItem();
    
    // events fired on drag element
    listItem.addEventListener('dragstart', evt => {
      const selectedItems = this.multiSelection.getSelectedItems();
      if(selectedItems.length > 1 && selectedItems.includes(listItem)) {
        const dt = evt.dataTransfer;

        const knots = selectedItems.map(item => item.knot);
        dt.setData("javascript/object", getTempKeyFor(knots));
        dt.setData("vivide/list-input", getTempKeyFor(knots));
        
        const hints = knots
          .map(knot => knot.label())
          .map(hintForLabel);
        const hintLength = hints.length;
        const maxLength = 5;
        if(hints.length > maxLength) {
          hints.length = maxLength;
          hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`))
        }
        const dragInfo = <div style="width: 151px;">
          {...hints}
        </div>;
        dragInfo::asDragImageFor(evt, -10, 2);
      } else {
        this.multiSelection.selectItem(listItem);
        
        knot.asDataForDrag(evt);
      }
      
    });
    listItem.addEventListener('drag', evt => {
      if(!evt.ctrlKey) return;
      lively.notify(evt.keyCode, evt.charCode);
    });
    listItem.addEventListener('dragend', evt => {
      listItem.style.color = null;
    });

    // events fired on drop target
    listItem.addEventListener('dragenter', evt => {
      lively.notify('dragenter');
      const dragInfo = <div width="200px" height="200px" style="background-color: blue"></div>;
      dragInfo::asDragImageFor(evt, -150, 50);
    });
    listItem.addEventListener('dragover', evt => lively.notify('dragover'));
    listItem.addEventListener('dragleave', evt => lively.notify('dragleave'));
    listItem.addEventListener('drop', evt => {
      lively.notify('drop');
      lively.notify(":", evt.dataTransfer.getData("knot/url"));
    });
    
    this.multiSelection.addItem(listItem);
    
    list.appendChild(listItem);
  }
    
  livelyMigrate(other) {
    this.setSearchTerm(other.searchTerm.innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}