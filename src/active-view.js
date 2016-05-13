
// abstract view class
class ActiveView {
  constructor() {
    if (new.target === ActiveView) {
      throw new TypeError('Cannot construct ActiveView directly');
    }
  }
}

export class ActiveDOMView extends ActiveView {
  constructor(selector, filterFunction) {
    super();

    this.selector = selector;
    this.filterFunction = filterFunction;
    this.mutationObserver = null;
    this.elements = new Set();
    this.entered = new Set();
    this.exited = new Set();
    
    this._setupObserver();
    this._collectElements();
  }

  /**
   * Sets up a MutationObserver that watches for DOM changes
   * @function ActiveDOMView#_setupObserver
   */
  _setupObserver() {
    this.mutationObserver = new MutationObserver(m => { this._observerCallback(m) });
    let config = {
      childList: true,
      subtree: true
    };

    this.mutationObserver.observe(document, config);
  }
  
  /**
   * Callback function for MutationObserver changes
   * @function ActiveDOMView#_observerCallback
   */
  _observerCallback(mutations) {
    console.debug(mutations);
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).forEach(n => {
          // check not itself
          if (this.matches(n)) {
            this._elementEnters(n);
          }
          
          // check children
          Array
            .from(n.querySelectorAll(this.selector))
            .filter(this.filterFunction)
            .forEach(m => this._elementEnters(m));
        });

        Array.from(mutation.removedNodes).forEach(n => {
          // check node itself (because there is no parent)
          if (this.matches(n)) {
            this._elementExits(n);
          }
          
          // check children
          Array
            .from(n.querySelectorAll(this.selector))
            .filter(this.filterFunction)
            .forEach(m => this._elementExits(m));
        });
      }
    });
  }
  
  /**
   * Collect all elements that match the selector and filter
   * @function ActiveDOMView#_collectElements
   */
  _collectElements() {
    this.elements = new Set();

    Array
      .from(document.querySelectorAll(this.selector))
      .filter(this.filterFunction)
      .forEach(n => this.elements.add(n));
  }
  
  /**
   * Logs element that entered the view
   * @function ActiveDOMView#_elementEnters
   * @param {HTMLElement} node
   */
  _elementEnters(node) {
    console.debug('adding', node);
    this.exited.delete(node);
    this.elements.add(node);
    this.entered.add(node);
  }
  
  /**
   * Logs element that exited the view
   * @function ActiveDOMView#_elementExits
   * @param {HTMLElement} node
   */
  _elementExits(node) {
    console.debug('removing', node);
    this.entered.delete(node);
    this.elements.delete(node);
    this.exited.add(node);
  }
  
  /**
   * Check if a node matches the views conditions
   * @function ActiveDOMView#matches
   * @param {HTMLElement} node
   * @return {boolean} whether or not it's a match
   */
  matches(node) {
    return node.matches(this.selector) && this.filterFunction(node);
  }
  
  /**
   * Call callback with all new elements since the last call
   * @function ActiveDOMView#enter
   * @param {function} callback
   * @return {ActiveDOMView} This view
   */
  enter(callback) {
    this.entered.forEach(e => callback(e));
    this.entered.clear();
    return this;
  }
  
  /**
   * Call callback with all removed elements since the last call
   * @function ActiveDOMView#exit
   * @param {function} callback
   * @return {ActiveDOMView} This view
   */
  exit(callback) {
    this.exited.forEach(e => callback(e));
    this.exited.clear();
    return this;
  }
}

class ActiveObjectView extends ActiveView {
  // TODO
}


// playground code

import { select } from './active-expressions.js';

let view = select('lively-menu', function(e) {
  return true;
});

console.debug(view);

window.testingView = view;
