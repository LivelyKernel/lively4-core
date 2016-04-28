
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
    this.elements = [];
    
    _setupObserver();
    _collectElements();
  }

  /**
   * Sets up a MutationObserver that watches for DOM changes
   * @function ActiveDOMView#_setupObserver
   */
  _setupObserver() {
    this.mutationObserver = new MutationObserver(_observerCallback);
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
    mutations.forEach(mutation => {
      console.debug(mutation);
    });
  }
  
  /**
   * Collect all elements that match the selector and filter
   * @function ActiveDOMView#_collectElements
   */
  _collectElements() {
    this.elements = [];

    let nodes = document.querySelectorAll(this.selector);
    for (let i = 0; i < nodes.length; i++) {
      if (this.filterFunction(nodes[i])) {
        this.elements.push({
          element: nodes[i],
          isNew: true,
          isGone: false
        });
      }
    }
  }
}

class ActiveObjectView extends ActiveView {
  // TODO
}
