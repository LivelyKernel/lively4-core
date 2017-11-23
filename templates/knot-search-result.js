import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { uuid as generateUUID, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';
import Keys from 'src/client/keys.js';

export default class KnotSearchResult extends Morph {
  // lazy initializer for knot array
  get knots() { return this._knots = this._knots || []; }
  
  async initialize() {
    this.windowTitle = "KnotSearchResult";
  }
  
  focus() {
    const listItem = this.get("li.last-selected");
    if(listItem) {
      listItem.focus();
    }
  }
  focusDefault() {
    const listItem = this.get("li");
    if(listItem) {
      listItem.focus();
      listItem.classList.toggle("selected");
      listItem.classList.add("last-selected");
    }
  }

  setSearchTerm(term) {
    this.get("#search-term").innerHTML = term;
  }
  
  removeSelection() {
    this.getAllSubmorphs('li.selected').forEach(item => {
      item.classList.remove('selected');
    });
  }
  removeLastSelection() {
    this.getAllSubmorphs('li.last-selected').forEach(item => {
      item.classList.remove('last-selected');
    });
  }
  
  async addKnot(knot) {
    this.knots.push(knot);
    const list = this.get("#result-list");
    const listItem = knot.toListItem();
    
    // events fired on drag element
    listItem.addEventListener('dragstart', evt => {
      const selectedItems = Array.from(this.getAllSubmorphs('li.selected'));
      if(selectedItems.length > 1 && selectedItems.includes(listItem)) {
        const dt = evt.dataTransfer;

        const knots = selectedItems.map(item => item.knot);
        dt.setData("javascript/object", getTempKeyFor(knots));
        
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
        this.removeSelection();
        listItem.classList.add("selected");
        
        knot.asDataForDrag(evt);
      }
    });
    listItem.addEventListener('drag', evt => {});
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
    
    /* ** MULTISELECTION ** */
    const selectFromLastSelectedTo = current => {
      const lastSelected = this.get(".last-selected") || this.get("li");

      // according to Ashton French
      // https://stackoverflow.com/questions/47398032/select-every-element-between-two-ids
      let firstIdFound = false;
      let applySelector = false;
      this.getAllSubmorphs("li")
        .filter(element => {
          if (element === lastSelected || element === current) {
            applySelector = firstIdFound ? false : true;
            firstIdFound = applySelector ? true : false;
            return true;
          }
          return applySelector;
        })
        .forEach(element => element.classList.add("selected"));
    }
    listItem.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(!evt.ctrlKey && !evt.shiftKey) {
        this.removeSelection();
        this.removeLastSelection();
        listItem.classList.add("selected");
        listItem.classList.add("last-selected");
      }
      if(evt.ctrlKey && !evt.shiftKey) {
        this.removeLastSelection();
        listItem.classList.toggle("selected");
        listItem.classList.add("last-selected");
      }
      if(evt.shiftKey) {
        if(!evt.ctrlKey) { this.removeSelection(); }
        selectFromLastSelectedTo(listItem);
      }
    });
    const navigate = (current, direction, ctrl, shiftKey) => {
      if(!ctrl) { this.removeSelection(); }
      if(!ctrl && !shiftKey) { this.removeLastSelection(); }

      const elements = this.getAllSubmorphs("li");
      const currentIndex = elements.indexOf(listItem);
      let nextIndex = currentIndex + direction;
      nextIndex += elements.length; // make module of -1 lead to last element
      nextIndex %= elements.length;
      const nextItem = elements[nextIndex];
      nextItem.focus();
      if(shiftKey) {
        selectFromLastSelectedTo(nextItem);
      } else if(ctrl) {
        // just change focus      
      } else {
        nextItem.classList.add("selected");
        nextItem.classList.add("last-selected");
      }
    };
    listItem.addEventListener('keydown', evt => {
      const ctrl = evt.ctrlKey || evt.metaKey;
      const { shiftKey, altKey, keyCode, charCode } = evt;

      //lively.notify(`keyCode: ${keyCode}, charCode: ${charCode}`);
      
      // Tab
      if(keyCode === 9) {
        lively.warn("Tab navigation not supported.");
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // up and down
      if(keyCode === 38 || keyCode === 40) {
        navigate(listItem, keyCode === 38 ? -1 : 1, ctrl, shiftKey);

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }

      // space
      if(keyCode === 32 && ctrl) {
        this.removeLastSelection();
        listItem.classList.toggle("selected");
        listItem.classList.add("last-selected");
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // ctrl + A
      if(keyCode === 65 && ctrl) {
        this.getAllSubmorphs("li")
          .forEach(element => element.classList.add("selected"));
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    });
    
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}