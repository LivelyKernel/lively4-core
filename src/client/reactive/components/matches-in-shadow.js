"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import select, { View} from 'active-groups';

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
  
  select() {
    return new View();
  }
}