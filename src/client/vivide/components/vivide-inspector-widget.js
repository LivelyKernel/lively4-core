"enable aexpr";

import VivideWidget from 'src/client/vivide/components/vivide-widget.js';

export default class VivideInspectorWidget extends VivideWidget {
  async initialize() {
    this.windowTitle = "VivideInspectorWidget";
    this.registerButtons();

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during developmentthis.get("#textField").value = this.getAttribute("data-mydata") || 0
  }
  get inspector() { return this.get('#inspector')}
  
  display(forest, config){
    super.display(forest, config);
    this.inspector.appendChild(this.displayInspector(forest));
  }
  
  displayInspector(value, name){
    if(Array.isArray(value)){
      const html = value.map(a => {
        return this.displayInspector(a.data);
      });
      return <div>{...html}</div>
    }
    if(typeof value.data === 'object'){
      return <span>Object</span>
    }
    return this.displayValue(value, name);
  }
  
  expandTemplate(node) {
    return <span class='syntax'><a class='expand'>{node.isExpanded ? 
      <span style='font-size:9pt'>&#9660;</span> : 
      <span style='font-size:7pt'>&#9654;</span>
    }</a></span>;
  }
  
  displayValue(value, name){
    if (name) {
      let attrValue;
      if (value && typeof value === 'symbol') {
        attrValue = value.toString();
      } else {
        attrValue = JSON.stringify(value).replace(/</g,"<");
      }
      return <div class="element">
        <span class='attrName'>{name}:</span>
        <span class='attrValue'>{attrValue}</span>
      </div>;
    } else {
      return <pre>{JSON.stringify(value)}</pre>;
    }
  }
  
  onDblClick() {
    this.animate([
      {backgroundColor: "lightgray"},
      {backgroundColor: "red"},
      {backgroundColor: "lightgray"},
    ], {
      duration: 1000
    })
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
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