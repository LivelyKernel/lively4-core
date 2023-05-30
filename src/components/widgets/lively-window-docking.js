import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect} from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.windowDocking = this;
    
    // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
    this.adjustBoundingHelperSize();
    
    // keep track of different docking areas the helpers can act in
    // because the window can be resized, the screen is seen from 0,0 to 1,1
    this.availableDockingAreas = [{"bounds": rect(0,0,1,1), "window": null}];
    
    lively.removeEventListener("docking", document.body);
    lively.addEventListener("docking", document.body, "onWindowDragging", (e) => {
      this.style.visibility = "visible";
    });
    lively.addEventListener("docking", document.body, "onWindowDraggingEnd", (e) => {
      this.style.visibility = "hidden";
    });
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
    this.adjustBoundingHelperSize();
    // @TODO adjust all docked windows in size
  }
  
  adjustBoundingHelperSize() {
    var helperSideLength = Math.min(window.innerWidth, window.innerHeight) * 0.05;
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      node.style.width = helperSideLength + "px";
      node.style.height = helperSideLength + "px";
    }
    // @TODO find a smart way to move position (remove css?)
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
      // @TODO move window docking helpers to new boundary
    }
  }
  
  getHoveredSlot(dockingCoords) {
    // should only return 1 max since they do not overlap
    // @TODO change accessors for rect
    var hoveredSlots = this.availableDockingAreas.filter((area) => (area.bounds.containsPoint(dockingCoords)));
    
    if (hoveredSlots.length == 0) {
      console.warn("Could not find hovered docking slot");
      return null;
    } else if (hoveredSlots.length > 1) {
      console.warn("Found multiple hovered docking slots at once");
    }
    return hoveredSlots[0];
  }
  
  getHoveredHelpers(clientCoords) {
    var allDockingHelperAreas = [];
    // takes all the docking helpers on the sides and fills allDockingHelperAreas with the bounding client rect (and the id to know which helper it was)
    
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      allDockingHelperAreas.push({"rect": node.getBoundingClientRect(), "id": node.id});
    }
    
    // @resize should only return 1 max since they do not overlap (however, this could change in the future)
    return allDockingHelperAreas.filter((area) => (clientCoords.x > area.rect.left && clientCoords.x < area.rect.right && clientCoords.y > area.rect.top && clientCoords.y < area.rect.bottom))
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
  
  checkDraggedWindow(draggedWindow, evt) {
    var clientCoords = pt(evt.clientX, evt.clientY);
    
    this.checkHoveredSlot(this.clientCoordsToDockingCoords(clientCoords));
    
    this.getHoveredHelpers(clientCoords).forEach((area) => {
      var type = "hide";
      switch (area.id) {
        case "helper-top":
          type = "top";
          break;
        case "helper-left":
          type = "left";
          break;
        case "helper-right":
          type = "right";
          break;
        case "helper-bottom":
          type = "bottom";
          break;
      }
      this.adjustDockingPreviewArea(type);
    });
  }
  
  checkReleasedWindow(releasedWindow, evt) {
    var clientCoords = pt(evt.clientX, evt.clientY);
    
    this.getHoveredHelpers(clientCoords).forEach((area) => {
      var type = "hide";
      switch (area.id) {
        case "helper-top":
          type = "top";
          break;
        case "helper-left":
          type = "left";
          break;
        case "helper-right":
          type = "right";
          break;
        case "helper-bottom":
          type = "bottom";
          break;
      }
      this.applyDockingToWindow(type, releasedWindow);
    });
  }
  
}

if (!lively.windowDocking) {
  lively.create("lively-window-docking").then(comp => {
    document.body.appendChild(comp)
  })
}


