import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect,Rectangle} from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.notify("Initialize window docking", name);
    lively.windowDocking = this;
    
    this.classList.add("lively-content")
    
    // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
    this.adjustBoundingHelpers();
    
    // keep track of different docking areas the helpers can act in
    // because the window can be resized, the screen is seen from 0,0 to 1,1
    if (!this.availableDockingAreas) {
      if (this.getAttribute("availableDockingAreas")) {
        var store = JSON.parse(this.getAttribute("availableDockingAreas"));
        this.availableDockingAreas = store.map(ea => {
          var win = null;
          if (ea.windowId) {
            win = lively.elementByID(ea.windowId);
          }
          return {"bounds": Rectangle.fromLiteral(ea.bounds), "window": win};
        })
      } else {
        this.availableDockingAreas = [{"bounds": rect(0,0,1,1), "window": null}];
      }
    }
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
    
    var clientBounds = rect(this.currentDockingSlot.bounds.left() * window.innerWidth, this.currentDockingSlot.bounds.top() * window.innerHeight, this.currentDockingSlot.bounds.getWidth() * window.innerWidth, this.currentDockingSlot.bounds.getHeight() * window.innerHeight);
    
    this.previewArea.style.visibility = (!(type == "hide") ? "visible" : "hidden"); 
    /* DEBUG
    console.log("v: " + this.previewArea.style.visibility);
    console.log("t: " + type);
    console.log("c: " + clientBounds);
    */
    switch (type) {
      case "top":
        this.setPreviewArea(clientBounds.left(), clientBounds.top(), clientBounds.getWidth(), clientBounds.getHeight() / 2); // topHalf
        break;
      case "left":
        this.setPreviewArea(clientBounds.left(), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // leftHalf
        break;
      case "bottom":
        this.setPreviewArea(clientBounds.left(), clientBounds.top() + (clientBounds.getHeight() / 2), clientBounds.getWidth(), clientBounds.getHeight() / 2); // bottomHalf
        break;
      case "right":
        this.setPreviewArea(clientBounds.left() + (clientBounds.getWidth() / 2), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // rightHalf
        break;
    }
}
  
  onResize() {
    this.adjustBoundingHelpers();
    this.availableDockingAreas.forEach(ea => {
      if (ea.window) {
        ea.window.dockTo(rect(ea.bounds.x * window.innerWidth, ea.bounds.y * window.innerHeight, ea.bounds.getWidth() * window.innerWidth, ea.bounds.getHeight() * window.innerHeight));
      }
    })
  }
  
  adjustBoundingHelpers() {
    if (!this.currentDockingSlot) return;
    
    var helperSideLength = Math.min(window.innerWidth, window.innerHeight) * 0.05;
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    var clientBounds = rect(this.currentDockingSlot.bounds.left() * window.innerWidth, this.currentDockingSlot.bounds.top() * window.innerHeight, this.currentDockingSlot.bounds.getWidth() * window.innerWidth, this.currentDockingSlot.bounds.getHeight() * window.innerHeight);
    for (let node of helpers) {
      node.style.width = helperSideLength + "px";
      node.style.height = helperSideLength + "px";
      switch (node.id) {
        case "helper-top":
          node.style.top = (clientBounds.top()) + "px"
          node.style.left = (clientBounds.left() + ((clientBounds.getWidth() - helperSideLength) * 0.5)) + "px";
          break;
        case "helper-left":
          node.style.top = (clientBounds.top() + ((clientBounds.getHeight() - helperSideLength) * 0.5)) + "px";
          node.style.left = (clientBounds.left()) + "px";
          break;
        case "helper-right":
          node.style.top = (clientBounds.top() + ((clientBounds.getHeight() - helperSideLength) * 0.5)) + "px";
          node.style.left = (clientBounds.left() + (clientBounds.getWidth() - helperSideLength)) + "px";
          break;
        case "helper-bottom":
          node.style.top = (clientBounds.top() + (clientBounds.getHeight() - helperSideLength)) + "px"
          node.style.left = (clientBounds.left() + ((clientBounds.getWidth() - helperSideLength) * 0.5)) + "px";
          break;
        case "helper-center":
          node.style.top = (clientBounds.top() + ((clientBounds.getHeight() - helperSideLength) * 0.5)) + "px";
          node.style.left = (clientBounds.left() + ((clientBounds.getWidth() - helperSideLength) * 0.5)) + "px";
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
      this.adjustBoundingHelpers();
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
    var clientBounds = rect(this.currentDockingSlot.bounds.left(), this.currentDockingSlot.bounds.top(), this.currentDockingSlot.bounds.getWidth(), this.currentDockingSlot.bounds.getHeight());
    var targetArea = rect(0,0,0,0);
    var oldArea = clientBounds;
    switch (type) {
      case "top":
        targetArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.getWidth(), clientBounds.getHeight() / 2); // topHalf
        oldArea = rect(clientBounds.left(), clientBounds.top() + (clientBounds.getHeight() / 2), clientBounds.getWidth(), clientBounds.getHeight() / 2); // bottomHalf
        break;
      case "left":
        targetArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // leftHalf
        oldArea = rect(clientBounds.left() + (clientBounds.getWidth() / 2), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // rightHalf
        break;
      case "bottom":
        targetArea = rect(clientBounds.left(), clientBounds.top() + (clientBounds.getHeight() / 2), clientBounds.getWidth(), clientBounds.getHeight() / 2); // bottomHalf
        oldArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.getWidth(), clientBounds.getHeight() / 2); // topHalf
        break;
      case "right":
        targetArea = rect(clientBounds.left() + (clientBounds.getWidth() / 2), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // rightHalf
        oldArea = rect(clientBounds.left(), clientBounds.top(), clientBounds.getWidth() / 2, clientBounds.getHeight()); // leftHalf
        break;
      case "center":
        if (this.currentDockingSlot.window) {
        // newWindow.createTabsWrapper(this.currentDockingSlot.window);
        } else {
          targetArea = rect(this.currentDockingSlot.bounds.left(), this.currentDockingSlot.bounds.top(), this.currentDockingSlot.bounds.getWidth(), this.currentDockingSlot.bounds.getHeight());
          var targetAreaFixed = rect(targetArea.x * window.innerWidth, targetArea.y * window.innerHeight, targetArea.getWidth() * window.innerWidth, targetArea.getHeight() * window.innerHeight);
          this.currentDockingSlot.window = newWindow;
          newWindow.dockTo(targetAreaFixed);
        }
        return;
      default:
        lively.error("Could not calculate docking bounds");
        return;
    }
    // convert areas to style coordinates
    var targetAreaFixed = rect(targetArea.x * window.innerWidth, targetArea.y * window.innerHeight, targetArea.getWidth() * window.innerWidth, targetArea.getHeight() * window.innerHeight);
    var oldAreaFixed = rect(oldArea.x * window.innerWidth, oldArea.y * window.innerHeight, oldArea.getWidth() * window.innerWidth, oldArea.getHeight() * window.innerHeight);
    this.currentDockingSlot.bounds = oldArea;
    if (this.currentDockingSlot.window) {
      this.currentDockingSlot.window.dockTo(oldAreaFixed);
    }
    this.availableDockingAreas.push({"bounds":targetArea, "window": newWindow});
    newWindow.dockTo(targetAreaFixed);
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
        case "helper-center":
          return "center";
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
    var dockingType = this.helperIdToDockingType(hoveredHelper.id);
    this.adjustDockingPreviewArea(dockingType);
  }
  
  checkReleasedWindow(releasedWindow, evt) {
    this.style.visibility = "hidden";
    
    var clientCoords = pt(evt.clientX, evt.clientY);
    
    var hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      return;
    }
    var dockingType = this.helperIdToDockingType(hoveredHelper.id);
    this.applyDockingToWindow(dockingType, releasedWindow);
    this.adjustDockingPreviewArea("hide"); // hide preview after docking. @TODO for some reason, this.style.visibility earlier wasn't enough?
  }
  
  livelyPrepareSave() {
    try {
      this.setAttribute("availableDockingAreas", JSON.stringify(this.availableDockingAreas.map(ea => {
      if (!ea.window) return {"bounds": ea.bounds}
      return {"bounds":ea.bounds, "windowId":lively.ensureID(ea.window)}})))
    } catch(e) {
      lively.notify(e);
    }
    
  }
  
  livelyMigrate(other) {
    this.availableDockingAreas = other.availableDockingAreas;
  }
  
}

if (!lively.windowDocking) {
  var windowDocking = document.body.querySelector("lively-window-docking");
  if (windowDocking) {
    lively.windowDocking = windowDocking;
    lively.notify("Found existing window docking");
  } else {
    lively.create("lively-window-docking").then(comp => {
      document.body.appendChild(comp)
    });
    lively.notify("Created new window docking");
  }
}


