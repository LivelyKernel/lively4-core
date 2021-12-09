"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import components from 'src/client/morphic/component-loader.js';

export default class LivelyTabsWrapper extends Morph {
  async initialize() {
    this.windowTitle = "LivelyTabsWrapper";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during development
    
    //this.get("#textField").value = this.getAttribute("data-mydata") || 0;
    
    // register click listener for plus button
    var plusBtn = this.get("#plus-btn");
    //plusBtn.addEventListener('click', (evt) => lively.notify("clicked"));
    lively.addEventListener("span", plusBtn, "click", async evt => await this.addWindow());
    
    if (!this.containedWindows) {      
       this.containedWindows = []; 
    }
    
    this.content = "";
    
  }
  
  async addWindow(window) {
    // create a window with container inside
    window = await lively.create("lively-window");
    var content = document.createElement("lively-container");
    components.openIn(window, content)
    window.title = "MyWindow";
    // inject window into this wrapper    
    this.get("#window-content").appendChild(window);
    this.containedWindows.push(window); // TODO: use DOM for this
    // add tab
    var windowObject = {
      "window": window,
      "id": "tab-bar-element-" + this.containedWindows.length + 1,
      "title": window.title
    };
    this.addTab(windowObject);
    lively.notify(windowObject.title + ", " + windowObject.id);
  }
  
  addTab(windowObject) {
    
    var newTab = (<div class="tab-bar-element" click={evt => {
          lively.notify("Worked!")
        }} id={windowObject.id}> {windowObject.title} </div>);
    
    var currentTabBar = this.get("#tab-bar-identifier");   
    currentTabBar.appendChild(newTab);
    
    //currentTabBar.innerHTML + newTabHtml.outerHTML;
    
    
    // #TODO Make it working
    /*
    lively.addEventListener("TabEventListener", newTabHtml, "click", () => {
      this.switchToContentOfTab(windowObject.id);
    });*/
    
    
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
  
  // this method is automatically registered a    for (var ea of other.containedWindows) {
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
  

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // For content in the window:
    //this.appendChild(<div>This is example content</div>);
    
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
  
  livelyMigrate(other)  {
    
    this.containedWindows = other.containedWindows;
    
  } 
  
  
}