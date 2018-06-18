"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import select, { View} from 'active-groups';

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
    lively.warn('ADDED')
  }
  detachedCallback() {
    lively.warn('REMOVED')
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    lively.warn('CHANGED ' + attrName, oldVal + ' -> ' + newVal);
  }
  keyframeHack(event) {
    lively.notify(event.animationName, event.selector);
    if (event.path && event.path[0]) {
      lively.showElement(event.path[0])
    }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
    const b = this.get('#firstButton');
    lively.warn('shadow match2?', b.matches('lively-window #firstButton'));
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
  
  select(selector) {
    const view = new View();
    
    // to Morph.select child elements
    const styles = document.createElement('style');
    const keyframes = document.createElement('style');
    const head = this.shadowRoot;
    
    styles.type = keyframes.type = 'text/css';
    head.appendChild(styles);
    head.appendChild(keyframes);

    let key = 'SelectorListener-1';
    let node = document.createTextNode(`@keyframes ${key} {
      from { outline-color: #fff; }
      to { outline-color: #000; }
    }`);
    keyframes.appendChild(node);
    styles.sheet.insertRule(`${selector} {
      animation-duration: 0.001s;
      animation-name: ${key} !important;
    }`, 0);

    this.shadowRoot.addEventListener('animationstart', event => {
      if(event.animationName === 'SelectorListener-1') {
        event.selector = selector;
        if (event.path && event.path[0]) {
          view.safeAdd(event.path[0]);
        }
      }
    }, false);

    return view;
  }
}