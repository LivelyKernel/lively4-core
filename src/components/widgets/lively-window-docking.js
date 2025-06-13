import Morph from 'src/components/widgets/lively-morph.js';
import { pt, rect, Rectangle } from 'src/client/graphics.js';
import {debugPrint} from "src/client/debug.js"
/*MD
 # LivelyWindowDocking - A component that manages window docking in a VS Code-like manner
 
 This component provides a tree-based window docking system that allows windows to be:
 - Docked to the edges (top, bottom, left, right) of other windows
 - Tabbed together in the center
 - Undocked and made floating
 
 The docking system uses a binary tree structure where:
 - Leaf nodes contain either a window or null (empty space)
 - Split nodes contain two child nodes and information about the split (direction and position)
 
 ## Example tree structure:
 ```
 {
   split: {
     dir: "left",
     pos: 0.5,
     a: { window: windowA },
     b: { window: windowB }
   }
 }
 ```

## Notes

#TODO keyboard shortcuts to dock focused window
#TODO compatibility with tabs (ex: drag tab out of docked window)

This won't work because we need to be able to split both directions.
{split: {dir: left, pos: 0.5, left: {split: {dir: top, pos: 0.5, left: {window: null}, right: {window: xyz}}}, right: {window: null}}}

So we could use this as an example of a one-off docked window to the right
The attributes are for easier understanding
```
{dir: left, pos:0.5, left: {window: null, }, right: {window: xyz}}
```

There exist two node types:
- Split Node
- Leaf Node (contains window or empty)

For example, a big fullscreen would mean:
```
{window: [window object or id]} (thats it)
```

If you want to then split a window abc with window xyz, it would then be:
```
{split: {dir: left, pos:0.5, a: {window: abc}, b: {window: xyz}}}
```

### RULES: 

- EVERY LEAF NODE HAS WINDOW OBJECT
- SPLIT NODES CANT HAVE A WINDOW OBJECT

DIFFERENCES TO IMGUI

In general, I have not found a good example for the ImGuiDockBuilder. It is clear that is has the following properties as well:
dock node (to 8 directions, either edge or corner (how would this work here?))

In Imgui (at least on the practical examples I see), there is a shortcut to "split to front" using the root of the tree, creating a new root. Is that really necessary? Also, the previous windows dont really change in size but rather adapt. Not sure about this sizing policy

#TODO can we do minimum pixel sizes to adjust splits when resizing? -> Apply constraint solver (like Cassowary with Apple)

fullscreen example:
{window: xyz}

split coordinates go 0 - 1, relative 
  
MD*/

export default class LivelyWindowDocking extends Morph {
  /**
   * The width of the docking area. In normal operation, this is the window's inner width.
   * Can be overridden with a fixed value for testing to ensure consistent results.
   * @returns {number} The width to use for docking calculations
   */
  get width() { 
    return this._width || window.innerWidth;
  }
  
  set width(val) { this._width = val; }
  
  /**
   * The height of the docking area. In normal operation, this is the window's inner height.
   * Can be overridden with a fixed value for testing to ensure consistent results.
   * @returns {number} The height to use for docking calculations
   */
  get height() { 
    return this._height || window.innerHeight;
  }
  
  set height(val) { this._height = val; }

  /**
   * Sets fixed dimensions for the docking area, overriding the default window dimensions.
   * This method should ONLY be used in tests to ensure consistent results.
   * @param {number} width - The fixed width to use
   * @param {number} height - The fixed height to use
   */
  setFixedDimensions(width, height) {
    this._width = width;
    this._height = height;
  }
  
  /**
   * Clears any fixed dimensions, causing the docking system to revert to using window dimensions.
   * This method should ONLY be used in tests after setFixedDimensions() has been used.
   */
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

  /**
   * Gets the parent map, building it if it doesn't exist.
   * The parent map maintains references from child nodes to their parent nodes in the docking tree.
   * @returns {WeakMap} A map from child nodes to their parent nodes
   */
  get parentMap() {
    if (!this._parentMap) {
      this.buildParentMap();
    }

    return this._parentMap;
  }

  /**
   * Gets the current docking tree structure.
   * Initializes with an empty tree if none exists, attempting to load from stored state first.
   * @returns {Object} The docking tree structure
   */
  get dockingTree() {
    if (!this._dockingTree) {
      let stored = this.getAttribute("dockingTree");
      if (stored) {
        console.log("Parsing docking tree from store");
        console.log(stored);
        try {
          let store = JSON.parse(stored);
          this._dockingTree = this.convertWindowIdToWindow(store);
          return;
        } catch (e) {
          lively.warn("Could not parse existing docking tree");
        }
      }
      console.log("Restoring default docking areas");
      this._dockingTree = { window: null };
    }

    return this._dockingTree;
  }

  set dockingTree(tree) {
    lively.notify("set dockingTree old", this.printDockingTree())
    this._dockingTree = tree;
    this.buildParentMap();
    lively.notify("set dockingTree new", this.printDockingTree())
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

  /**
   * Converts client coordinates to docking space coordinates (0-1 range).
   * @param {Point} clientCoords - The client coordinates to convert
   * @returns {Point} The coordinates in docking space
   */
  clientCoordsToDockingCoords(clientCoords) {
    return pt(clientCoords.x / this.width, clientCoords.y / this.height);
  }

  /**
   * Converts docking space coordinates (0-1 range) to client coordinates.
   * @param {Point} dockingCoords - The docking space coordinates to convert
   * @returns {Point} The coordinates in client space
   */
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
    if (hoveredNode && hoveredNode != this.currentDockingNode && !hoveredNode.window) {
      this.tryAdjoiningEmptyNodes(hoveredNode);
    }
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
  
  replaceNodeInDockingTree(currentNode, targetNode, replacement) {
    if (currentNode === targetNode)  {
      return replacement;
    }
    if (currentNode.split) {
      return {split:{dir: currentNode.split.dir, pos: currentNode.split.pos, a: this.replaceNodeInDockingTree(currentNode.split.a || currentNode.split.left, targetNode, replacement), b: this.replaceNodeInDockingTree(currentNode.split.b || currentNode.split.right, targetNode, replacement)}};
    }
    return currentNode;
  }

  /**
   * Applies a docking operation to a window.
   * @param {string} dockingType - The type of docking operation ('top', 'left', 'bottom', 'right', or 'center')
   * @param {HTMLElement} newWindow - The window element to dock
   * @returns {Promise<void>}
   */
  async applyDockingToWindow(dockingType, newWindow) {
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
      // Replace the node in the tree that "currentDockingNode" was pointing to
      this.dockingTree = this.replaceNodeInDockingTree(this.dockingTree, this.currentDockingNode, {
        split: {
          dir: dockingType, 
          pos: 0.5,
          a: ["bottom", "right"].includes(dockingType) ? this.currentDockingNode : {window: newWindow},
          b: ["bottom", "right"].includes(dockingType) ? {window: newWindow} : this.currentDockingNode
        }
      });
      
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

  /**
   * Undocks a window from the docking tree.
   * After undocking, attempts to adjoin any empty nodes to maintain tree efficiency.
   * @param {HTMLElement} win - The window element to undock
   */
  undockMe(win) {
    let myNode = this.findNodeOfWindow(this.dockingTree, win);
    if (!myNode) return;
    
    let parent = this.parentMap.get(myNode);
    
    // Update currentDockingNode if it's the one being removed
    if (this.currentDockingNode === myNode) {
      this.currentDockingNode = null;
    }
    
    // If this is the root node, simply null the window
    if (!parent || !parent.split) {
      myNode.window = null;
      this.tryAdjoiningEmptyNodes(myNode);
      return;
    }
    
    // Get the sibling node (the one we want to keep)
    let siblingNode = parent.split.a === myNode ? parent.split.b : parent.split.a;
    
    // Get the grandparent to see if we need to update the root
    let grandparent = this.parentMap.get(parent);
    
    if (!grandparent) {
      // Parent is the root, so make the sibling the new root
      this.dockingTree = siblingNode;
    } else {
      // Replace the parent split with the sibling in the grandparent
      this.dockingTree = this.replaceNodeInDockingTree(this.dockingTree, parent, siblingNode);
    }
    
    // After restructuring, resize all windows to maintain proper layout
    this.resizeWindowsInSlot(this.dockingTree, rect(0, 0, 1, 1));
  }

  /**
   * @TODO
   * Resizes the slot of a window to a new size.
   * @param {HTMLElement} win - The window element whose slot is to be resized
   * @param {Object} newSize - The new size for the slot
   */
  resizeMySlot(win, newSize) {
    return;
    /*
    newSize = this.clientCoordsToDockingCoords(newSize);
    if (!newSize) throw new Error("newSize is missing")
    let slot = this.availableDockingAreas.find((area) => (area.window == win)); // recheck diff between let and let
    lively.notify("Resize slot called");

    if (slot && slot.bounds) {
      this.availableDockingAreas.forEach(ea => {
        // @TODO make sure slot !== ea
        let newBounds = null;
        debugger;
        lively.notify("huh");
        if (ea.bounds.left() == slot.bounds.left() && ea.bounds.width == slot.bounds.width) { // vertical setup
          lively.notify("shoiuld NOT");
          if (ea.bounds.top() + ea.bounds.height == slot.bounds.top()) { // ea top() of slot
            // resize ea height until slot top
            newBounds = rect(ea.bounds.left(), ea.bounds.top(), ea.bounds.width, slot.bounds.top() - ea.bounds.top());
          } else if (slot.bounds.top() + slot.bounds.height == ea.bounds.top()) { // ea bottom of slot
            // resize ea top to floor of slot - adjust height together
            let newTop = slot.bounds.top() + slot.bounds.height;
            let newHeight = (ea.bounds.top() + ea.bounds.height) - newTop;
            newBounds = rect(ea.bounds.left(), newTop, ea.bounds.width, newHeight);
          }
        } else if (ea.bounds.top() == slot.bounds.top() && ea.bounds.height == slot.bounds.height) { // horizontal setup
          lively.notify("should YES");
          if (ea.bounds.left() + ea.bounds.width == slot.bounds.left()) { // ea left() of slot
            // resize ea width until slot left
            newBounds = rect(ea.bounds.left(), ea.bounds.top(), slot.bounds.left() - ea.bounds.left(), ea.bounds.height);
          } else if (slot.bounds.left() + slot.bounds.width == ea.bounds.left()) { // ea right of slot
            // resize ea left to right edge of slot - adjust width together
            let newLeft = slot.bounds.left() + slot.bounds.width;
            let newWidth = (ea.bounds.left() + ea.bounds.width) - newLeft;
            newBounds = rect(newLeft, slot.bounds.top(), newWidth, slot.bounds.height);
          }
        }
        if (newBounds) {
          ea.bounds = newBounds;
          lively.notify("NEW ADJACENT");
          if (ea.window) {
            // resize window in other slot
            lively.setPosition(ea.window, pt(newBounds.left(), newBounds.top()));
            lively.setExtent(ea.window, pt(newBounds.width, newBounds.height));
          }
        }
      });
      // only finally resize it's own slot after each neighboring slot has been accounted for. expect newSize to be compatible with bounds?
      slot.bounds = rect(slot.bounds.x, slot.bounds.y, newSize.x, newSize.y);
    }
    */
  }

  tryAdjoiningEmptyNodes(node) {
    if (!node || typeof node !== 'object') return;
    
    let parent = this.parentMap.get(node);
    if (!parent || !parent.split) return;
    
    // Make sure both child nodes exist before checking their windows
    if (parent.split.a && parent.split.b && 
        !parent.split.a.window && !parent.split.b.window) {
      delete parent.split;
      parent.window = null;
      this.tryAdjoiningEmptyNodes(parent);
    }
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

  /**
   * Prints the current docking tree structure for debugging purposes.
   * @param {Object} node - The node to print (defaults to root dockingTree)
   * @param {string} indent - The current indentation level (for recursive calls)
   * @param {string} prefix - A prefix to identify the current node (e.g., 'ROOT', 'LEFT', 'RIGHT')
   * @returns {string} A string representation of the docking tree
   */
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
