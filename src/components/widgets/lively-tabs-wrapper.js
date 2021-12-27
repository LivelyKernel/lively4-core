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
  
  getWindowObjects() {
    // Get the tabs
    var tabs = this.get("#tab-bar-identifier");
    
  }
  
  async addWindow(window) {
    var id = Date.now();
    // create a window with container inside
    window = await lively.create("lively-window");
    window.title = id;
    window.id = "window-" + id;
    var content = document.createElement("lively-container");
    components.openIn(window, content);
    window.get(".window-titlebar").style.setProperty("display", "none");
    
    // inject window into this wrapper    
    this.appendChild(window);
    this.containedWindows.push(window); // TODO: use DOM for this
    
    // add tab
   var newTab = (<li click={async evt => { await this.switchToContentOfWindow(window)}} id={"tab-" + id} class="tab"> 
                    <a>{window.title}
                      <span class="window-button windows-close"
                        click={async evt => { await this.removeTab(id)}}>
                        <i class="fa fa-close"/>
                      </span>
                    </a>
                  </li>);
    var tabBar = this.get("#tab-bar-identifier");   
    tabBar.appendChild(newTab);
    // lively.notify("Added tab " + id);
    
    // TODO: bring the new tab to foreground
    
    this.getWindowObjects();
  }
  
  async removeTab(id) {
    this.get("#tab-" + id).remove();
    this.get("#window-" + id).remove();
    // TODO: put focus on another tab it closed tab was in foreground
  }
  
  async switchToContentOfWindow(window) {
    
    if (window) {
      
      // Removes the class "tab-foreground" from all tabs.
      for (var i = 0; i < this.containedWindows.length; i++) {        
        var currWindow = this.containedWindows[i];
        this.get("#" + currWindow.id).classList.remove("tab-foreground");
      }
      
      // Adds the class "tab-foreground" to the desired window
      this.get("#" + window.id).classList.add("tab-foreground");
      
    } else {
      lively.notify("Could not read content of Window " + window.title);
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
    
  }
  
  livelyMigrate(other)  {
    
    this.containedWindows = other.containedWindows;
    
  }
  
  /*
  Returns the id of a window without "window-". 
  */
  getWindowId(window) {
    return window.id.substring(7);
  }  
  
}