"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class JumpingCubes extends Morph {
  get field() { return this.get('#field'); }

  async initialize() {
    this.windowTitle = "JumpingCubes";

    const colorMap = new Map([
      ['red', 'rgba(255, 126, 126, 1.0)'],
      ['green', 'rgba(126, 255, 126, 1.0)'],
      ['gray', 'rgba(176, 176, 176, 1.0)']
    ]);

    this.field.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const div = <div></div>;
      for (let j = 0; j < 10; j++) {
        let cube = { value: 2, color: 'gray' };
        const button = <button click={evt => cube.value++}>un-init</button>;
        aexpr(() => cube.value).dataflow(value => button.innerHTML = value);
        aexpr(() => cube.color).dataflow(value => button.style.background = colorMap.get(value));
        div.appendChild(button);
      }
      this.field.appendChild(div);
    }
    
  }
  
  onDblClick() {
    this.animate([
      {backgroundColor: "lightgray"},
      {backgroundColor: "red"},
      {backgroundColor: "lightgray"},
    ], {
      duration: 1000
    }).whenFinished()
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) + 1
  }
  
  onMinusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) - 1
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
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
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
    this.appendChild(<div>This is my content</div>)
  }
  
  
}