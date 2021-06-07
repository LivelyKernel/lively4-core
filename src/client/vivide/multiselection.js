function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

/*MD # Multiselection 

<graphviz-dot>
<script>
digraph  {a -> b; b -> c; c -> a}
</script>
</graphviz-dot>
MD*/
export default class MultiSection {
  static defaultOptions() {
    return {
      selector: 'li',
      classSelected: 'selected',
      classLastSelected: 'last-selected',
      onSelectionChanged: selection => {},
      keyCodePrev: 38,
      keyCodeNext: 40
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
  
  focus() {
    const lastSelectedItem = this.get(this.selectorLastSelected);
    if(lastSelectedItem) {
      lastSelectedItem.focus();
      return;
    }
    
    const fallbackItem = this.get(this.selector);
    if(fallbackItem) {
      fallbackItem.focus();
      fallbackItem.classList.toggle(this.classSelected);
      fallbackItem.classList.add(this.classLastSelected);
      this.selectionChanged();
    }
  }
  
  _removeSelection() {
    this.getAllSubmorphs(this.selectorSelected).forEach(item => {
      item.classList.remove(this.classSelected);
    });
  }
  _removeLastSelection() {
    this.getAllSubmorphs(this.selectorLastSelected).forEach(item => {
      item.classList.remove(this.classLastSelected);
    });
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
  }

  addItem(item) {
    item.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(!evt.ctrlKey && !evt.shiftKey) {
        this.selectItem(item);
        this.selectionChanged();
      }
      if(evt.ctrlKey && !evt.shiftKey) {
        this._removeLastSelection();
        item.classList.toggle(this.classSelected);
        item.classList.add(this.classLastSelected);
        this.selectionChanged();
      }
      if(evt.shiftKey) {
        if(!evt.ctrlKey) { this._removeSelection(); }
        this._selectFromLastSelectedTo(item);
        this.selectionChanged();
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
      } else if(ctrl) {
        // just change focus
      } else {
        nextItem.classList.add(this.classSelected, this.classLastSelected);
      }
    };

    // ensure to accept keyboard events
    if(!item.hasAttribute('tabindex')) {
      item.setAttribute('tabindex', 1);
    }

    item.addEventListener('keydown', evt => {
      const ctrl = evt.ctrlKey || evt.metaKey;
      const { shiftKey, altKey, keyCode, charCode } = evt;
      
      // Tab
      if(keyCode === 9) {
        lively.warn("Tab navigation not supported.");
        
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // up and down
      if(keyCode === this.keyCodePrev || keyCode === this.keyCodeNext) {
        _navigate(item, keyCode === this.keyCodePrev ? -1 : 1, ctrl, shiftKey);
        this.selectionChanged();

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }

      // space
      if(keyCode === 32 && ctrl) {
        this._removeLastSelection();
        item.classList.toggle(this.classSelected);
        item.classList.add(this.classLastSelected);
        this.selectionChanged();

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // escape
      if(keyCode === 27) {
        this._removeSelection();
        this._removeLastSelection();
        
        const focussedItem = this.get(this.selector + ':focus');
        if(focussedItem) {
          focussedItem.classList.add(this.classSelected, this.classLastSelected);
        }
        this.selectionChanged();

        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      
      // ctrl + A
      if(keyCode === 65 && ctrl) {
        this.getAllSubmorphs(this.selector)
          .forEach(element => element.classList.add(this.classSelected));
        this.selectionChanged();

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

