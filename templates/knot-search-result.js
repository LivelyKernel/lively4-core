import Morph from 'src/components/widgets/lively-morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { uuid as generateUUID, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';
import Keys from 'src/client/keys.js';

function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

class MultiSection {
  static defaultOptions() {
    return {
      selector: 'li',
      classSelected: 'selected',
      classLastSelected: 'last-selected',
      onSelectionChanged: selection => {}
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
    
    this.lastSelection = [];
  }
  
  focusLastSelected() {
    const listItem = this.get(this.selectorLastSelected);
    if(listItem) {
      listItem.focus();
    }
    // this.selectionChanged('focusLastSelected');
  }
  focusDefault() {
    const listItem = this.get(this.selector);
    if(listItem) {
      listItem.focus();
      listItem.classList.toggle(this.classSelected);
      listItem.classList.add(this.classLastSelected);
    }
    this.selectionChanged('focusDefault');
  }
  
  _removeSelection() {
    this.getAllSubmorphs(this.selectorSelected).forEach(item => {
      item.classList.remove(this.classSelected);
    });
    // this.selectionChanged('_removeSelection');
  }
  _removeLastSelection() {
    this.getAllSubmorphs(this.selectorLastSelected).forEach(item => {
      item.classList.remove(this.classLastSelected);
    });
    // this.selectionChanged('_removeLastSelection');
  }
  
  _selectFromLastSelectedTo(current) {
    const lastSelected = this.get(this.selectorLastSelected) || this.get(this.selector);
    
    if(current === lastSelected) {
      current.classList.add(this.classSelected);
      return;
    }

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
    // this.selectionChanged('_selectFromLastSelectedTo');
  }

  addItem(item) {
    item.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(!evt.ctrlKey && !evt.shiftKey) {
        this.selectItem(item);
        this.selectionChanged('click');
      }
      if(evt.ctrlKey && !evt.shiftKey) {
        this._removeLastSelection();
        item.classList.toggle(this.classSelected);
        item.classList.add(this.classLastSelected);
        this.selectionChanged('click ctrl');
      }
      if(evt.shiftKey) {
        if(!evt.ctrlKey) { this._removeSelection(); }
        this._selectFromLastSelectedTo(item);
        this.selectionChanged('click shift');
      }
    });
    const _navigate = (current, direction, ctrl, shiftKey) => {
      if(!ctrl) { this._removeSelection(); }
      if(!ctrl && !shiftKey) { this._removeLastSelection(); }

      const elements = this.getAllSubmorphs(this.selector);
      const currentIndex = elements.indexOf(item);
      let nextIndex = currentIndex + direction;
      nextIndex += elements.length; // make module of -1 lead to last element
      nextIndex %= elements.length;
      const nextItem = elements[nextIndex];
      nextItem.focus();
      if(shiftKey) {
        this._selectFromLastSelectedTo(nextItem);
        // this.selectionChanged('_navigate shift');
      } else if(ctrl) {
        // just change focus
        // this.selectionChanged('_navigate ctrl');
      } else {
        nextItem.classList.add(this.classSelected, this.classLastSelected);
        // this.selectionChanged('_navigate');
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
        _navigate(item, keyCode === 38 ? -1 : 1, ctrl, shiftKey);
        this.selectionChanged('prev/next');

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // escape
      if(keyCode === 23 && ctrl) {
        this.removeSelection();
        
        this.getAllSubmorphs(this.selector)
          .forEach(element => element.classList.add(this.classSelected));
        this.selectionChanged('strg A');

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // ctrl + A
      if(keyCode === 65 && ctrl) {
        this.getAllSubmorphs(this.selector)
          .forEach(element => element.classList.add(this.classSelected));
        this.selectionChanged('strg A');

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    });
  }
  
  selectItem(item) {
    this._removeSelection();
    this._removeLastSelection();
    item.classList.add(this.classSelected, this.classLastSelected);
    //this.selectionChanged('selectItem');
  }
  
  getSelectedItems() {
    return this.getAllSubmorphs(this.selectorSelected);
  }
  
  selectionChanged(from) {
    let newSelection = this.getSelectedItems();
    if(!eqSet(new Set(newSelection), new Set(this.lastSelection))) {
      // lively.success(from, 'new selection', 2);
      this.lastSelection = newSelection;
      this.onSelectionChanged(newSelection);
    } else {
      // lively.error(from, 'selection was the same/unnecessary call', 2);
    }
  }
}

export default class KnotSearchResult extends Morph {
  // lazy initializer for knot array
  get knots() { return this._knots = this._knots || []; }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSection(this, { selector: 'li', onSelectionChanged: selection => lively.notify(selection.length, 'selection changed') });
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