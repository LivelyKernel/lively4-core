import Morph from 'src/components/widgets/lively-morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { uuid as generateUUID, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';
import Keys from 'src/client/keys.js';

class MultiSection {
  static defaultOptions() {
    return {
      selector: 'li',
      classSelected: 'selected',
      classLastSelected: 'last-selected'
    };
  }
  
  getAllSubmorphs(...args) { return this.morph.getAllSubmorphs(...args); }
  get(...args) { return this.morph.get(...args); }
  
  get selectorSelected() {
    return this.selector + '.' + this.classSelected;
  }
  get selectorLastSelected() {
    return this.selector + '.' + this.classLastSelected;
  }
  
  constructor(morph, options = {}) {
    this.morph = morph;
    Object.assign(this, MultiSection.defaultOptions(), options);
  }
  
  focusLastSelected() {
    const listItem = this.get(this.selectorLastSelected);
    if(listItem) {
      listItem.focus();
    }
  }
  focusDefault() {
    const listItem = this.get(this.selector);
    if(listItem) {
      listItem.focus();
      listItem.classList.toggle(this.classSelected);
      listItem.classList.add(this.classLastSelected);
    }
  }
  
  removeSelection() {
    this.getAllSubmorphs(this.selectorSelected).forEach(item => {
      item.classList.remove(this.classSelected);
    });
  }
  removeLastSelection() {
    this.getAllSubmorphs(this.selectorLastSelected).forEach(item => {
      item.classList.remove(this.classLastSelected);
    });
  }
  
  selectFromLastSelectedTo(current) {
    const lastSelected = this.get(this.selectorLastSelected) || this.get(this.selector);

    // according to Ashton French
    // https://stackoverflow.com/questions/47398032/select-every-element-between-two-ids
    let firstIdFound = false;
    let applySelector = false;
    this.getAllSubmorphs(this.selector)
      .filter(element => {
        if (element === lastSelected || element === current) {
          applySelector = firstIdFound ? false : true;
          firstIdFound = applySelector ? true : false;
          return true;
        }
        return applySelector;
      })
      .forEach(element => element.classList.add(this.classSelected));
  }

  addItem(item) {
    item.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(!evt.ctrlKey && !evt.shiftKey) {
        this.removeSelection();
        this.removeLastSelection();
        item.classList.add(this.classSelected, this.classLastSelected);
      }
      if(evt.ctrlKey && !evt.shiftKey) {
        this.removeLastSelection();
        item.classList.toggle(this.classSelected);
        item.classList.add(this.classLastSelected);
      }
      if(evt.shiftKey) {
        if(!evt.ctrlKey) { this.removeSelection(); }
        this.selectFromLastSelectedTo(item);
      }
    });
    const navigate = (current, direction, ctrl, shiftKey) => {
      if(!ctrl) { this.removeSelection(); }
      if(!ctrl && !shiftKey) { this.removeLastSelection(); }

      const elements = this.getAllSubmorphs(this.selector);
      const currentIndex = elements.indexOf(item);
      let nextIndex = currentIndex + direction;
      nextIndex += elements.length; // make module of -1 lead to last element
      nextIndex %= elements.length;
      const nextItem = elements[nextIndex];
      nextItem.focus();
      if(shiftKey) {
        this.selectFromLastSelectedTo(nextItem);
      } else if(ctrl) {
        // just change focus
      } else {
        nextItem.classList.add(this.classSelected, this.classLastSelected);
      }
    };
    item.addEventListener('keydown', evt => {
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
        navigate(item, keyCode === 38 ? -1 : 1, ctrl, shiftKey);

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }

      // space
      if(keyCode === 32 && ctrl) {
        this.removeLastSelection();
        item.classList.toggle(this.classSelected);
        item.classList.add(this.classLastSelected);
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // ctrl + A
      if(keyCode === 65 && ctrl) {
        this.getAllSubmorphs(this.selector)
          .forEach(element => element.classList.add(this.classSelected));
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    });
  }
  
  getSelectedItems() {
    return this.getAllSubmorphs(this.selectorSelected);
  }
}

export default class KnotSearchResult extends Morph {
  // lazy initializer for knot array
  get knots() { return this._knots = this._knots || []; }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSection(this, { selector: 'li' });
  }
  
  get searchTerm() { return this.get("#search-term");}
  
  async initialize() {
    this.windowTitle = "KnotSearchResult";
  }
  
  focus() {
    this.multiSelection.focusLastSelected();
  }
  focusDefault() {
    this.multiSelection.focusDefault();
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
        this.multiSelection.removeSelection();
        listItem.classList.add(this.multiSelection.classSelected);
        
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