import Morph from 'src/components/widgets/lively-morph.js';
import { pt, rect, Rectangle } from 'src/client/graphics.js';
import {debugPrint} from "src/client/debug.js"


export default class LivelyWindowDocking extends Morph {

  get width() { 
    return this._width || window.innerWidth;
  }
  set width(val) { this._width = val; }

  get height() { 
    return this._height || window.innerHeight;
  }
  
  set height(val) { this._height = val; }

  setFixedDimensions(width, height) {
    this._width = width;
    this._height = height;
  }

  clearFixedDimensions() {
    this._width = undefined;
    this._height = undefined;
  }

  async initialize() {
    lively.notify("Initialize window docking", name);
    lively.windowDocking = this;
        this.classList.add("lively-content")

    // don't do this when testing
    if (this.parentElement === document.body) {
      // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
      this.adjustBoundingHelpers();

      lively.removeEventListener("docking", window, "resize")
      lively.addEventListener("docking", window, "resize", evt => this.onResize(evt))
    }
  }
  
  convertWindowIdToWindow(node) {
    if (!node || typeof node !== 'object') return null;
    
    let newNode = {};
    if (node.windowId) {
      let win = lively.elementByID(node.windowId);
      if (win) newNode.window = win;
    }
    if (node.split) {
      newNode.split = {
        dir: node.split.dir,
        pos: node.split.pos,
        a: node.split.a ? this.convertWindowIdToWindow(node.split.a) : { window: null },
        b: node.split.b ? this.convertWindowIdToWindow(node.split.b) : { window: null }
      };
    } else if (!newNode.window) {
      newNode.window = null;
    }
    return newNode;
  }

  convertWindowToWindowId(node) {
    if (!node || typeof node !== 'object') return null;
    
    let newNode = {};
    if (node.window) {
      newNode.windowId = lively.ensureID(node.window);
    }
    if (node.split) {
      newNode.split = {
        dir: node.split.dir,
        pos: node.split.pos,
        a: node.split.a ? this.convertWindowToWindowId(node.split.a) : { windowId: null },
        b: node.split.b ? this.convertWindowToWindowId(node.split.b) : { windowId: null }
      };
    } else if (!newNode.windowId) {
      newNode.windowId = null;
    }
    return newNode;
  }

  refreshParentMap(node) {
    if (!node || typeof node !== 'object') return;
    
    if (node.split) {
      // Only set parent references if the child nodes are valid objects
      if (node.split.a && typeof node.split.a === 'object') {
        this._parentMap.set(node.split.a, node);
        this.refreshParentMap(node.split.a);
      }
      if (node.split.b && typeof node.split.b === 'object') {
        this._parentMap.set(node.split.b, node);
        this.refreshParentMap(node.split.b);
      }
    }
  }

  buildParentMap() {
    this._parentMap = new WeakMap();
    this.refreshParentMap(this.dockingTree);
  }

  get parentMap() {
    if (!this._parentMap) {
      this.buildParentMap();
    }
    return this._parentMap;
  }

  get dockingTree() {
    if (!this._dockingTree) {
      let stored = this.getAttribute("dockingTree");
      if (stored) {
        try {
          let store = JSON.parse(stored);
          this._dockingTree = this.convertWindowIdToWindow(store);
          return;
        } catch (e) {
          lively.warn("Could not parse existing docking tree");
        }
      }
      this._dockingTree = { window: null };
    }

    return this._dockingTree;
  }

  set dockingTree(tree) {
    // Guard against invalid tree structures
    if (!tree) {
      lively.warn("Attempted to set null/undefined docking tree. Using empty tree instead.");
      tree = { window: null };
    }
    this._dockingTree = tree;
    // Always rebuild the parent map after setting a new tree
    this.buildParentMap();  
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

  // assumption rect(x,y,width,height)
  getABoundary(split, boundary) {
    if (!split || !boundary) return null;
    
    switch (split.dir) {
      case "top":
        return rect(boundary.left(), boundary.top(), boundary.getWidth(), boundary.getHeight() * split.pos);
      case "bottom":
        return rect(boundary.left(), boundary.top(), boundary.getWidth(), boundary.getHeight() * split.pos);
      case "left":
        return rect(boundary.left(), boundary.top(), boundary.getWidth() * split.pos, boundary.getHeight());
      case "right": // For right splits, section A is on the left
        return rect(boundary.left(), boundary.top(), boundary.getWidth() * split.pos, boundary.getHeight());
      default:
        console.warn("Unknown split direction:", split.dir);
        return boundary;
    }
  }

  getBBoundary(split, boundary) {
    if (!split || !boundary) return null;
    
    switch (split.dir) {
      case "bottom":
        var bottomPartHeight = boundary.getHeight() * split.pos;
        return rect(boundary.left(), boundary.top() + bottomPartHeight, boundary.getWidth(), boundary.getHeight() - bottomPartHeight);
      case "top":
        var topPartHeight = boundary.getHeight() * split.pos;
        return rect(boundary.left(), boundary.top() + topPartHeight, boundary.getWidth(), boundary.getHeight() - topPartHeight);
      case "right": // For right splits, section B is on the right
        var rightPartWidth = boundary.getWidth() * split.pos;
        return rect(boundary.left() + rightPartWidth, boundary.top(), boundary.getWidth() - rightPartWidth, boundary.getHeight());
      case "left": // For left splits, section B is on the right
        var rightPartWidth = boundary.getWidth() * split.pos;
        return rect(boundary.left() + rightPartWidth, boundary.top(), boundary.getWidth() - rightPartWidth, boundary.getHeight());
      default:
        console.warn("Unknown split direction:", split.dir);
        return boundary;
    }
  }

  // @REFACTOR
  getBoundsForNode(target, current, boundary) {
    if (!current) return null;
    if (current === target) {
      return boundary;
    }
    if (current.split) {
      let aBounds = this.getABoundary(current.split, boundary);
      let aNode = current.split.a || current.split.left;
      let aNodeBounds = this.getBoundsForNode(target, aNode, aBounds);
      if (aNodeBounds) return aNodeBounds;
      
      let bBounds = this.getBBoundary(current.split, boundary);
      let bNode = current.split.b || current.split.right;
      let bNodeBounds = this.getBoundsForNode(target, bNode, bBounds);
      if (bNodeBounds) return bNodeBounds;
    }
    return null;
  }

  resizeWindowsInSlot(node, boundary) {
    if (node.window) {
      node.window.dockTo(this.dockingRectToClientRect(boundary));
    }
    if (node.split) {
      this.resizeWindowsInSlot(node.split.a || node.split.left, this.getABoundary(node.split, boundary));
      this.resizeWindowsInSlot(node.split.b || node.split.right, this.getBBoundary(node.split, boundary));
    }
  }

  onResize() {
    this.adjustBoundingHelpers();
    this.resizeWindowsInSlot(this.dockingTree, rect(0, 0, 1, 1));
  }

  // WHEN DRAGGING: 

  adjustDockingPreviewArea(type) {
    
    if (!this.currentDockingNode) return;

    if (type == "hide") {
      this.previewArea.style.visibility = "hidden";
      return;
    }

    this.previewArea.style.visibility = "visible";
    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));
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
      case "center":
        this.setPreviewArea(clientBounds.left(), clientBounds.top(), clientBounds.getWidth(), clientBounds.getHeight());
        break;
    }
  }

  adjustBoundingHelpers() {
    if (!this.currentDockingNode) return;

    let helperSideLength = Math.min(window.innerWidth, window.innerHeight) * 0.05;
    let helpers = this.shadowRoot?.querySelectorAll('.helper-fixed');
    if (!helpers) return;

    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));
    if (!clientBounds) return;

    for (let node of helpers) {
      if (!node.id) continue;
      
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
        default:
          console.warn("Unknown helper id:", node.id);
      }
    }
  }


  clientCoordsToDockingCoords(clientCoords) {
    return pt(clientCoords.x / this.width, clientCoords.y / this.height);
  }

  dockingCoordsToClientCoords(dockingCoords) {
    return pt(dockingCoords.x * this.width, dockingCoords.y * this.height);
  }

  // assumption: rect(x,y,width,height)
  clientRectToDockingRect(clientRect) {
    return rect(clientRect.left() / this.width, clientRect.top() / this.height, clientRect.getWidth() / this.width, clientRect.getHeight() / this.height);
  }

  dockingRectToClientRect(dockingRect) {
    if (!dockingRect) return null;
    return rect(dockingRect.left() * this.width, dockingRect.top() * this.height, dockingRect.getWidth() * this.width, dockingRect.getHeight() * this.height);
  }

  checkHoveredSlot(dockingCoords) {    
    let hoveredNode = this.getHoveredSlot(dockingCoords);
            
    // Store the previous node for comparison
    const previousNode = this.currentDockingNode;
    this.currentDockingNode = hoveredNode;
    
    this.adjustBoundingHelpers();
  }

  getLeafNodeForDockingCoords(dockingCoords, node, currentBoundary) {
    if (node && node.split) {
      if (this.getABoundary(node.split, currentBoundary).containsPoint(dockingCoords)) {
        return this.getLeafNodeForDockingCoords(dockingCoords, node.split.a || node.split.left, this.getABoundary(node.split, currentBoundary));
      } else {
        return this.getLeafNodeForDockingCoords(dockingCoords, node.split.b || node.split.right, this.getBBoundary(node.split, currentBoundary));
      }
    }
    return node;
  }

  // @TODO maybe cache areas in the future
  getHoveredSlot(dockingCoords) {
    return this.getLeafNodeForDockingCoords(dockingCoords, this.dockingTree, rect(0,0,1,1))
  }
  
  getHoveredHelper(clientCoords) {
    let allDockingHelperAreas = [];
    // takes all the docking helpers on the sides and fills allDockingHelperAreas with the bounding client rect (and the id to know which helper it was)

    let helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      allDockingHelperAreas.push({ "rect": node.getBoundingClientRect(), "id": node.id });
    }

    return allDockingHelperAreas.find((area) => (clientCoords.x > area.rect.left && clientCoords.x < area.rect.right && clientCoords.y > area.rect.top && clientCoords.y < area.rect.bottom))
  }
  
  replaceNodeInDockingTree(currentNode, targetNode, replacement, operation = 'replace node') {
    console.log('replaceNodeInDockingTree\n   current:', this.printDockingTree(currentNode) + "\n   target:" + this.printDockingTree(targetNode) +"\n   replacement: " + this.printDockingTree(replacement), operation);
    
    // Handle null or undefined nodes gracefully
    if (!currentNode) {
  
      return replacement;
    }
    
    if (currentNode === targetNode) {

      return replacement;
    }
    
    if (currentNode.split) {
      let newA = this.replaceNodeInDockingTree(
        currentNode.split.a || currentNode.split.left, 
        targetNode, 
        replacement,
        operation
      );
      
      let newB = this.replaceNodeInDockingTree(
        currentNode.split.b || currentNode.split.right, 
        targetNode, 
        replacement,
        operation
      );
      
      return {
        split: {
          dir: currentNode.split.dir, 
          pos: currentNode.split.pos, 
          a: newA, 
          b: newB
        }
      };
    }
    
    return currentNode;
  }

  async applyDockingToWindow(dockingType, newWindow) {
    console.log("applyDockingToWindow "  + dockingType + " " + newWindow.title)
    
    if (!this.currentDockingNode) {
      lively.warn("No docking node selected");
      return;
    }

    if (!newWindow) {

      lively.error("No window provided for docking");
      return;
    }

    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));
    if (!clientBounds) {
      lively.error("Could not determine bounds for docking");
      return;
    }

    if (dockingType == "center") {
      try {        
        if (this.currentDockingNode.window) {
          this.currentDockingNode.window = await newWindow.tabIntoWindow(this.currentDockingNode.window);
        } else {
          this.currentDockingNode.window = newWindow;
        }
        this.currentDockingNode.window.dockTo(clientBounds);
      } catch (e) {
        lively.error("Failed to dock window in center:", e);
      }
      return;
    }

    const availableTypes = ["top", "left", "bottom", "right"];
    if (!availableTypes.includes(dockingType)) {

      lively.error("Invalid docking type:", dockingType);
      return;
    }

    try {
      // Record the original node for debugging
      const originalNode = this.currentDockingNode;
      
      // Build the new split node
      const splitNode = {
        split: {
          dir: dockingType, 
          pos: 0.5,
          a: ["bottom", "right"].includes(dockingType) ? this.currentDockingNode : {window: newWindow},
          b: ["bottom", "right"].includes(dockingType) ? {window: newWindow} : this.currentDockingNode
        }
      };      
      // Replace the node in the tree that "currentDockingNode" was pointing to
      this.dockingTree = this.replaceNodeInDockingTree(
        this.dockingTree, 
        this.currentDockingNode, 
        splitNode,
        `dock: ${dockingType}`
      );
      
      // Explicitly rebuild parent map after tree structure changes
      this.buildParentMap();
      
      this.resizeWindowsInSlot(this.dockingTree, rect(0,0,1,1));
    } catch (e) {
      lively.error("Failed to apply docking:", e);
    }
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
    console.log("checkDraggedWindow " +  draggedWindow.title)
    this.style.visibility = "visible";

    let clientCoords = pt(evt.clientX, evt.clientY);
    this.checkHoveredSlot(this.clientCoordsToDockingCoords(clientCoords));

    let hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      return;
    }
    let dockingType = this.helperIdToDockingType(hoveredHelper.id);
    this.adjustDockingPreviewArea(dockingType);
  }

  checkReleasedWindow(releasedWindow, evt) {
    console.log("checkReleasedWindow " +  releasedWindow.title)
    this.style.visibility = "hidden";

    let clientCoords = pt(evt.clientX, evt.clientY);

    let hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      return;
    }
    
    let dockingType = this.helperIdToDockingType(hoveredHelper.id);
    
    this.applyDockingToWindow(dockingType, releasedWindow);
    this.adjustDockingPreviewArea("hide"); // hide preview after docking    
  }

  findNodeOfWindow(node, window) {
    if (!node) return null;
    if (node.window === window) {
      return node;
    }
    if (node.split) {
      let aNode = node.split.a || node.split.left;
      let bNode = node.split.b || node.split.right;
      let maybeANode = this.findNodeOfWindow(aNode, window);
      if (maybeANode) return maybeANode;
      let maybeBNode = this.findNodeOfWindow(bNode, window);
      if (maybeBNode) return maybeBNode;
    }
    return null;
  }

  undockMe(win) {
    console.log("undockme " + win.title)
    let myNode = this.findNodeOfWindow(this.dockingTree, win);
    if (!myNode) {
      return;
    }
    
    let parent = this.parentMap.get(myNode);
    
    // Update currentDockingNode if it's the one being removed
    if (this.currentDockingNode === myNode) {
      this.currentDockingNode = null;
    }
    
    // If this is the root node, simply null the window
    if (!parent || !parent.split) {
      // Take a deep copy before modification
      const oldTree = JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v));
      
      myNode.window = null;
      
      this.buildParentMap();
            
      return;
    }
    
    // Take a deep copy before modification
    const oldTree = JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v));
    
    // Get the sibling node (the one we want to keep)
    let siblingNode = parent.split.a === myNode ? parent.split.b : parent.split.a;
    
    // Get the grandparent to see if we need to update the root
    let grandparent = this.parentMap.get(parent);
    
    if (!grandparent) {
      // Parent is the root, so make the sibling the new root
      this.dockingTree = siblingNode;
    } else {
      // Replace the parent split with the sibling in the grandparent
      this.dockingTree = this.replaceNodeInDockingTree(this.dockingTree, parent, siblingNode, 'undock: replace parent with sibling');
    }
    
    // Explicitly rebuild parent map after tree structure changes
    this.buildParentMap();
    
   
    // After restructuring, resize all windows to maintain proper layout
    this.resizeWindowsInSlot(this.dockingTree, rect(0, 0, 1, 1));
  }

  
  containsWindows(node) {
    if (!node) return false
    if (node.window) return true
    return this.containsWindows(node.a) || this.containsWindows(node.b)
  }
    
  livelyPrepareSave() {
    try {
      this.setAttribute("dockingTree", JSON.stringify(this.convertWindowToWindowId(this.dockingTree)));
    } catch (e) {
      lively.notify(e);
    }
  }

  livelyMigrate(other) {
    this.dockingTree = other.dockingTree;
  }

  printDockingTree(node = this.dockingTree, indent = '', prefix = 'ROOT') {
    if (!node) {
      return indent + prefix + ': null\n';
    }

    let result = indent + prefix + ' ' +debugPrint(node) + ': ' ;
    
    if (node.window) {
      // For leaf nodes with windows, show the window ID or some identifier
      let windowId = node.window.title || 'unnamed-window';
      result += `[Window: ${windowId}]\n`;
    } else if (node.split) {
      // For split nodes, show the split info and recursively print children
      result += `[Split: ${node.split.dir} at ${(node.split.pos * 100).toFixed(1)}%]\n`;
      result += this.printDockingTree(node.split.a, indent + '  ', 'A');
      result += this.printDockingTree(node.split.b, indent + '  ', 'B');
    } else {
      // For empty leaf nodes
      result += '[Empty]\n';
    }
    return result;
  }
}

if (!lively.windowDocking) {
  let windowDocking = document.body.querySelector("lively-window-docking");
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
