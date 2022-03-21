"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import select, { View} from 'active-group';
import { PausableLoop } from 'utils';

class ReactiveSelector {
  static selectorByNode(node) {
    return;
  }
  constructor() {
    
  }
}

export default class MatchesInShadow extends Morph {
  async initialize() {
    this.windowTitle = "MatchesInShadow";
    this.__selectorID__ = 1;
    this.addEventListener('animationstart', event => {
      if(event.animationName === 'MyKeyframes' || event.animationName === 'MyKeyframes2') {
        event.selector = 'button:hover';
        this.keyframeHack(event);
      }
    }, false);
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
  }
  attachedCallback() {
    // lively.warn('ADDED')
  }
  detachedCallback() {
    // lively.warn('REMOVED')
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    // lively.warn('CHANGED ' + attrName, oldVal + ' -> ' + newVal);
  }
  keyframeHack(event) {
    // lively.notify(event.animationName, event.selector);
    // if (event.path && event.path[0]) {
    //   lively.showElement(event.path[0])
    // }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    // lively.notify("hello")
    const b = this.get('#firstButton');
    // lively.warn('shadow match2?', b.matches('lively-window #firstButton'));
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "red"
    this.someJavaScriptProperty = 42;
    const b = document.createElement('button');
    b.innerHTML = 'Child'
    b.id = 'button1';
    b.addEventListener('click', evt => {
      lively.warn('child match?', b.matches('lively-window #button1'));

    })
    this.appendChild(b)
  }
  
  get domSelectors() {
    return this._domSelectors = this._domSelectors || {
      
    };
  }
  // hasDOMSelectors() {}
  
  // #TODO: refactor to class/module
  // 
  get selectorID() {
    if(this.__selectorID__ === undefined) {
      
    }
    return
  }
  select(selector) {
    
    const view = new View();
    
    // to Morph.select child elements
    const styles = document.createElement('style');
    const keyframes = document.createElement('style');
    const head = this.shadowRoot;
    
    styles.type = keyframes.type = 'text/css';
    head.appendChild(styles);
    head.appendChild(keyframes);

    let key = 'SelectorListener-' + this.__selectorID__++;
    `@keyframes ${key} {
      from { outline-color: #fff; }
      to { outline-color: #000; }
    }`
    let node = document.createTextNode(`@keyframes ${key} {
      from { perspective: 1px; }
      to { perspective: 2px; }
    }`);
    keyframes.appendChild(node);
    styles.sheet.insertRule(`${selector} {
      animation-duration: 0.001s;
      animation-name: ${key} !important;
    }`, 0);

    this.shadowRoot.addEventListener('animationstart', event => {
      if(event.animationName === key) {
        event.selector = selector;
        if (event.path && event.path[0]) { // #TODO: use event.target
          const targetElement = event.path[0];
          view.safeAdd(targetElement);
          
          stopMatchingDetectors.add({
            matchesSelector() {
              const inDOM = targetElement.getRootNode({ composed: true }) === document;
              // return inDOM && this.getAllSubmorphs(selector).includes(targetElement);
              return inDOM && targetElement.matches(selector);
            },
            removeElement() { view.safeRemove(targetElement); }
          });
          stopMatchingLoop.ensureRunning();
        }
      }
    }, false);

    return view;
  }
}

/**
 * chrome does not support the animationcancel event, so we have to resort back to other means, namely polling
 */
const stopMatchingDetectors = new Set();

function removeObsoleteListeners() {
  Array.from(stopMatchingDetectors).forEach(detector => {
    if(!detector.matchesSelector()) {
      detector.removeElement();
      stopMatchingDetectors.delete(detector);
    }
  });
  if(stopMatchingDetectors.size === 0) {
    stopMatchingLoop.pause();
  }
}

const stopMatchingLoop = new PausableLoop(() => {
  // lively.warn('check stop matching (Morph)');
  removeObsoleteListeners();
});


export function __unload__() {
  // styles.remove();
  // keyframes.remove();
  // roots.forEach(root => root.removeEventListener(startName, startEvent, false));
  
  stopMatchingLoop.pause();
}
