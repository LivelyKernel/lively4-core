import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect} from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.windowDocking = this;
    
    // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
    this.adjustBoundingHelpers();
    
    // keep track of different docking areas the helpers can act in
    // because the window can be resized, the screen is seen from 0,0 to 1,1
    this.availableDockingAreas = [{"bounds": rect(0,0,1,1), "window": null}];
  }
  
  get previewArea() {
    return this.get('#helper-preview')
  }
  
  setPreviewArea(x, y, width, height) {
    this.previewArea.style.left = x + "px";
    this.previewArea.style.top = y + "px";
    this.previewArea.style.width = width + "px";
    this.previewArea.style.height = height + "px";
  }
  
  adjustDockingPreviewArea(type) {
    if (!this.currentDockingSlot) return;
    // @TODO refactor for rect shorthands, needs time...
  var clientBounds = rect(this.currentDockingSlot.bounds.left() * window.innerWidth, this.currentDockingSlot.bounds.top() * window.innerHeight, this.currentDockingSlot.bounds.right() * window.innerWidth, this.currentDockingSlot.bounds.bottom() * window.innerHeight);
  this.previewArea.style.visibility = (!(type == "hide") ? "visible" : "hidden"); 
    //console.log(this.previewArea.style.visibility); 
    //console.log(clientBounds);
    switch (type) {
      case "top":
        this.setPreviewArea(clientBounds.left(), clientBounds.top(), clientBounds.right(), clientBounds.top() + (clientBounds.height / 2));
        break;
      case "left":
        this.setPreviewArea(clientBounds.left(), clientBounds.top(), clientBounds.left() + (clientBounds.width / 2), clientBounds.bottom());
        break;
      case "bottom":
        this.setPreviewArea(clientBounds.left(), clientBounds.top() + (clientBounds.height / 2), clientBounds.right(), clientBounds.bottom());
        break;
      case "right":
        this.setPreviewArea(clientBounds.left() + (clientBounds.width / 2), clientBounds.top(), clientBounds.right(), clientBounds.bottom());
        break;
    }
}
  
  onResize() {
    this.adjustBoundingHelpers();
    // @TODO adjust all docked windows in size
    // this could just iterate through all docking slots, check the new coordinates and call dockTo on the contained window
  }
  
  adjustBoundingHelpers() {
    var helperSideLength = Math.min(window.innerWidth, window.innerHeight) * 0.05;
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      node.style.width = helperSideLength + "px";
      node.style.height = helperSideLength + "px";
      switch (node.id) {
        case "helper-top":
          node.style.top = 0 + "px"
          node.style.left = ((window.innerWidth - helperSideLength) * 0.5) + "px";
          break;
        case "helper-left":
          node.style.top = ((window.innerHeight - helperSideLength) * 0.5) + "px";
          node.style.left = 0 + "px";
          break;
        case "helper-right":
          node.style.top = ((window.innerHeight - helperSideLength) * 0.5) + "px";
          node.style.left = (window.innerWidth - helperSideLength) + "px";
          break;
        case "helper-bottom":
          node.style.top = (window.innerHeight - helperSideLength) + "px"
          node.style.left = ((window.innerWidth - helperSideLength) * 0.5) + "px";
          break;
      }
    }
  }
  
  clientCoordsToDockingCoords(clientCoords) {
    return pt(clientCoords.x / window.innerWidth, clientCoords.y / window.innerHeight);
  }
  
  dockingCoordsToClientCoords(dockingCoords) {
    return pt(dockingCoords.x * window.innerWidth, dockingCoords.y * window.innerHeight);
  }
  
  
  
  checkHoveredSlot(dockingCoords) {
    this.currentDockingSlot = this.getHoveredSlot(dockingCoords);
    
    if (this.currentDockingSlot) {
      //this.adjustBoundingHelpers();
    }
  }
  
  getHoveredSlot(dockingCoords) {
    return this.availableDockingAreas.find((area) => (area.bounds.containsPoint(dockingCoords)));
  }
  
  getHoveredHelper(clientCoords) {
    var allDockingHelperAreas = [];
    // takes all the docking helpers on the sides and fills allDockingHelperAreas with the bounding client rect (and the id to know which helper it was)
    
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      allDockingHelperAreas.push({"rect": node.getBoundingClientRect(), "id": node.id});
    }
    
    return allDockingHelperAreas.find((area) => (clientCoords.x > area.rect.left && clientCoords.x < area.rect.right && clientCoords.y > area.rect.top && clientCoords.y < area.rect.bottom))
  }
  
  applyDockingToWindow(type, newWindow) {
    if (!this.currentDockingSlot) {
      lively.error("No active docking slot to apply window to was found.");
    }
    var clientBounds = rect(this.currentDockingSlot.bounds.left() * window.innerWidth, this.currentDockingSlot.bounds.top() * window.innerHeight, this.currentDockingSlot.bounds.right() * window.innerWidth, this.currentDockingSlot.bounds.bottom() * window.innerHeight);
  this.previewArea.style.visibility = (!(type == "hide") ? "visible" : "hidden"); 
    var targetArea = rect(0,0,0,0);
    var oldArea = clientBounds;
    switch (type) {
      case "top":
        targetArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.right(), clientBounds.top() + (clientBounds.height / 2));
        break;
      case "left":
        targetArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.left() + (clientBounds.width / 2), clientBounds.bottom());
        break;
      case "bottom":
        targetArea = rect(clientBounds.left(), clientBounds.top() + (clientBounds.height / 2), clientBounds.right(), clientBounds.bottom());
        break;
      case "right":
        targetArea = rect(clientBounds.left() + (clientBounds.width / 2), clientBounds.top(), clientBounds.right(), clientBounds.bottom());
        break;
    }
    // @TODO find out how to actually change the current slot with affecting the slot in the "available docking areas" array
    this.currentDockingSlot.bounds = oldArea;
    if (this.currentDockingSlot.window) {
      this.currentDockingSlot.window.dockTo(oldArea);
    }
    this.availableDockingAreas.push({"bounds":targetArea, "window": newWindow});
    newWindow.dockTo(targetArea);
    console.log("called dockTo");
  }
  
  helperIdToDockingType(helperId) {
      switch (helperId) {
        case "helper-top":
          return "top";
        case "helper-left":
          return "left";
        case "helper-right":
          return "right";
        case "helper-bottom":
          return "bottom";
      }
    return "hide";
  }
  
  checkDraggedWindow(draggedWindow, evt) {
    this.style.visibility = "visible";
    
    var clientCoords = pt(evt.clientX, evt.clientY);
    
    this.checkHoveredSlot(this.clientCoordsToDockingCoords(clientCoords));
    
    var hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      return;
    }
    this.adjustDockingPreviewArea(hoveredHelper.id);
  }
  
  checkReleasedWindow(releasedWindow, evt) {
    this.style.visibility = "hidden";
    
    var clientCoords = pt(evt.clientX, evt.clientY);
    
    var hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      return;
    }
    this.applyDockingToWindow(hoveredHelper.id, releasedWindow);
    this.adjustDockingPreviewArea(hoveredHelper.id);
  }
  
}

if (!lively.windowDocking) {
  lively.create("lively-window-docking").then(comp => {
    document.body.appendChild(comp)
  })
}


