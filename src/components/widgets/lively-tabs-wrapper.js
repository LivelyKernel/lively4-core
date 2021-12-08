"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTabsWrapper extends Morph {
  async initialize() {
    this.windowTitle = "LivelyTabsWrapper";
    this.registerButtons()

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
    // replaced during development
    
    //this.get("#textField").value = this.getAttribute("data-mydata") || 0;
    
    this.containedWindows = []; 
    
    this.content = "";
    
  }
  
  addWindow(window) {
    
    var windowObject = {
      
      "window": window,
      "id": "tab-bar-element-" + this.containedWindows.length + 1,
      "title": window.title()
      
    }
    
    lively.notify(windowObject.title + ", " + windowObject.id);
    this.containedWindows.push(window);
  }
  
  addTab(windowObject) {
    
    var newTabHtml = (<span class="tab-bar-element" id={windowObject.id}> {windowObject.title} </span>);
    
    var currentTabBar = this.get("#tab-bar-identifier");    
    currentTabBar.innerHTML = currentTabBar.innerHTML + newTabHtml.outerHTML;
    
    // #TODO Make it working
    lively.addEventListener("TabEventListener", newTabHtml, "click", () => {
      this.switchToContentOfTab(windowObject.id);
    });
  }
  
  switchToContentOfTab(tabId) {
    
    for (var i = 0; i < this.containedWindows.length; i++) {
      if (this.containedWindows[i].id === tabId) {
        this.switchToContentOfWindow(this.containedWindows[i]);
      } 
    }
    lively.notify("Tab Id was not found.")
    
  }
  
  switchToContentOfWindow(windowObj) {
    if (windowObj.window) {
      this.appendChild(windowObj.window.window());
    } else {
      this.appendChild("Could not read content of Window " + windowObj.title);
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
  
  

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // For content in the window:
    // this.appendChild(<div>This is example content</div>);
    
    var winObj1 = {
      "window": null,
      "id": "tab-bar-element-1",
      "title": "My Tab Bar 1"
    }
    
    var winObj2 = {
      "window": null,
      "id": "tab-bar-element-2",
      "title": "My Tab Bar 2"
    }
    
    this.addTab(winObj1);
    this.addTab(winObj2);
    
  }
  
  
}