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
    
    // Enable tree change logging by default
    this.enableTreeChangeLogging(true);

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
    // Guard against invalid tree structures
    if (!tree) {
      lively.warn("Attempted to set null/undefined docking tree. Using empty tree instead.");
      tree = { window: null };
    }
    
    // Log the change if logging is enabled
    this.logTreeChange('Set docking tree directly', this._dockingTree, tree);
    
    // Log the state before change for debugging (keep for backward compatibility)
    lively.notify("set dockingTree old", this.printDockingTree());
    
    this._dockingTree = tree;
    
    // Always rebuild the parent map after setting a new tree
    this.buildParentMap();
    
    // Log the state after change for debugging
    lively.notify("set dockingTree new", this.printDockingTree());
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
    if (this._treeLoggingEnabled) {
      console.group('checkHoveredSlot');
      console.log('Checking at coordinates:', dockingCoords);
      console.log('Current tree structure:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
    }
    
    let hoveredNode = this.getHoveredSlot(dockingCoords);
    
    if (this._treeLoggingEnabled) {
      console.log('Hovered node:', hoveredNode);
      console.log('Current docking node:', this.currentDockingNode);
    }
    
    if (hoveredNode && hoveredNode != this.currentDockingNode && !hoveredNode.window) {
      if (this._treeLoggingEnabled) {
        console.log('Detected empty node different from current, checking for adjoining');
      }
      this.tryAdjoiningEmptyNodes(hoveredNode);
    }
    
    // Store the previous node for comparison
    const previousNode = this.currentDockingNode;
    this.currentDockingNode = hoveredNode;
    
    if (this._treeLoggingEnabled) {
      if (previousNode !== hoveredNode) {
        console.log('Current docking node changed:', 
          previousNode ? 'from node with ' + (previousNode.window ? 'window' : 'no window') : 'from null',
          'to', 
          hoveredNode ? 'node with ' + (hoveredNode.window ? 'window' : 'no window') : 'null');
      }
      console.groupEnd();
    }
    
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
    // Handle null or undefined nodes gracefully
    if (!currentNode) {
      if (this._treeLoggingEnabled) {
        console.warn('replaceNodeInDockingTree called with null currentNode', new Error().stack);
      }
      return replacement;
    }
    
    if (currentNode === targetNode) {
      if (this._treeLoggingEnabled) {
        console.log(`replaceNodeInDockingTree: Found target node, replacing with ${replacement ? (replacement.window ? 'window node' : replacement.split ? 'split node' : 'unknown type') : 'null'}`);
      }
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

  /**
   * Applies a docking operation to a window.
   * @param {string} dockingType - The type of docking operation ('top', 'left', 'bottom', 'right', or 'center')
   * @param {HTMLElement} newWindow - The window element to dock
   * @returns {Promise<void>}
   */
  async applyDockingToWindow(dockingType, newWindow) {
    // Log the operation start
    if (this._treeLoggingEnabled) {
      console.group(`Dock window operation: ${dockingType} dock for ${newWindow.title || 'unnamed window'}`);
      console.log('Current docking node:', this.currentDockingNode);
      console.log('Before docking:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
    }
    
    if (!this.currentDockingNode) {
      if (this._treeLoggingEnabled) {
        console.warn("No docking node selected");
        console.groupEnd();
      }
      lively.warn("No docking node selected");
      return;
    }

    if (!newWindow) {
      if (this._treeLoggingEnabled) {
        console.error("No window provided for docking");
        console.groupEnd();
      }
      lively.error("No window provided for docking");
      return;
    }

    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));
    if (!clientBounds) {
      if (this._treeLoggingEnabled) {
        console.error("Could not determine bounds for docking");
        console.groupEnd();
      }
      lively.error("Could not determine bounds for docking");
      return;
    }

    if (dockingType == "center") {
      try {
        if (this._treeLoggingEnabled) {
          console.log('Center docking: ' + (this.currentDockingNode.window ? 'tabbing into existing window' : 'placing in empty slot'));
        }
        
        if (this.currentDockingNode.window) {
          this.currentDockingNode.window = await newWindow.tabIntoWindow(this.currentDockingNode.window);
        } else {
          this.currentDockingNode.window = newWindow;
        }
        this.currentDockingNode.window.dockTo(clientBounds);
        
        if (this._treeLoggingEnabled) {
          console.log('After docking (center):', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
          console.groupEnd();
        }
      } catch (e) {
        if (this._treeLoggingEnabled) {
          console.error("Failed to dock window in center:", e);
          console.groupEnd();
        }
        lively.error("Failed to dock window in center:", e);
      }
      return;
    }

    const availableTypes = ["top", "left", "bottom", "right"];
    if (!availableTypes.includes(dockingType)) {
      if (this._treeLoggingEnabled) {
        console.error("Invalid docking type:", dockingType);
        console.groupEnd();
      }
      lively.error("Invalid docking type:", dockingType);
      return;
    }

    try {
      if (this._treeLoggingEnabled) {
        console.log(`Creating split node with direction: ${dockingType}`);
      }
      
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
      
      if (this._treeLoggingEnabled) {
        console.log('New split node:', splitNode);
      }
      
      // Replace the node in the tree that "currentDockingNode" was pointing to
      this.dockingTree = this.replaceNodeInDockingTree(
        this.dockingTree, 
        this.currentDockingNode, 
        splitNode,
        `dock: ${dockingType}`
      );
      
      // Explicitly rebuild parent map after tree structure changes
      this.buildParentMap();
      
      // Verify the tree has the expected structure
      if (this._treeLoggingEnabled) {
        console.log('After docking:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
      }
      
      this.resizeWindowsInSlot(this.dockingTree, rect(0,0,1,1));
      
      if (this._treeLoggingEnabled) {
        console.groupEnd();
      }
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
    if (this._treeLoggingEnabled) {
      console.group('Window Dragged');
      console.log('Dragged window:', draggedWindow.title || 'unnamed');
      console.log('Initial tree structure:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
    }
    
    this.style.visibility = "visible";

    let clientCoords = pt(evt.clientX, evt.clientY);

    this.checkHoveredSlot(this.clientCoordsToDockingCoords(clientCoords));

    let hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      if (this._treeLoggingEnabled) {
        console.log('No helper hovered, hiding preview');
        console.groupEnd();
      }
      return;
    }
    
    let dockingType = this.helperIdToDockingType(hoveredHelper.id);
    
    if (this._treeLoggingEnabled) {
      console.log('Helper hovered:', hoveredHelper.id, 'Docking type:', dockingType);
      console.log('Final tree structure:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
      console.groupEnd();
    }
    
    this.adjustDockingPreviewArea(dockingType);
  }

  checkReleasedWindow(releasedWindow, evt) {
    if (this._treeLoggingEnabled) {
      console.group('Window Released');
      console.log('Released window:', releasedWindow.title || 'unnamed');
      console.log('Initial tree structure:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
    }
    
    this.style.visibility = "hidden";

    let clientCoords = pt(evt.clientX, evt.clientY);

    let hoveredHelper = this.getHoveredHelper(clientCoords);
    if (!hoveredHelper) {
      this.adjustDockingPreviewArea("hide");
      if (this._treeLoggingEnabled) {
        console.log('No helper hovered, aborting dock operation');
        console.groupEnd();
      }
      return;
    }
    
    let dockingType = this.helperIdToDockingType(hoveredHelper.id);
    
    if (this._treeLoggingEnabled) {
      console.log('Helper hovered for release:', hoveredHelper.id, 'Docking type:', dockingType);
    }
    
    this.applyDockingToWindow(dockingType, releasedWindow);
    this.adjustDockingPreviewArea("hide"); // hide preview after docking
    
    if (this._treeLoggingEnabled) {
      console.log('Final tree structure after docking:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
      console.log('Verifying tree consistency:');
      this.analyzeDockingTree();
      console.groupEnd();
    }
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
    // Log the operation start
    if (this._treeLoggingEnabled) {
      console.group(`Undock window operation: ${win.title || 'unnamed window'}`);
      console.log('Before undocking:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
    }
    
    let myNode = this.findNodeOfWindow(this.dockingTree, win);
    if (!myNode) {
      if (this._treeLoggingEnabled) {
        console.warn('Window not found in docking tree');
        console.groupEnd();
      }
      return;
    }
    
    let parent = this.parentMap.get(myNode);
    
    // Update currentDockingNode if it's the one being removed
    if (this.currentDockingNode === myNode) {
      this.currentDockingNode = null;
    }
    
    // If this is the root node, simply null the window
    if (!parent || !parent.split) {
      if (this._treeLoggingEnabled) {
        console.log('Undocking root window node, setting to null');
      }
      
      // Take a deep copy before modification
      const oldTree = JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v));
      
      myNode.window = null;
      
      // We've modified the tree, ensure parent map is updated
      this.buildParentMap();
      
      this.tryAdjoiningEmptyNodes(myNode);
      
      // Log the result
      if (this._treeLoggingEnabled) {
        console.log('After undocking root window:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
        console.groupEnd();
      }
      return;
    }
    
    // Take a deep copy before modification
    const oldTree = JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v));
    
    // Get the sibling node (the one we want to keep)
    let siblingNode = parent.split.a === myNode ? parent.split.b : parent.split.a;
    
    if (this._treeLoggingEnabled) {
      console.log('Parent node:', parent);
      console.log('Sibling node to keep:', siblingNode);
    }
    
    // Get the grandparent to see if we need to update the root
    let grandparent = this.parentMap.get(parent);
    
    if (!grandparent) {
      // Parent is the root, so make the sibling the new root
      if (this._treeLoggingEnabled) {
        console.log('Parent is root, replacing with sibling node');
      }
      this.dockingTree = siblingNode;
    } else {
      // Replace the parent split with the sibling in the grandparent
      if (this._treeLoggingEnabled) {
        console.log('Replacing parent node with sibling in grandparent');
      }
      this.dockingTree = this.replaceNodeInDockingTree(this.dockingTree, parent, siblingNode, 'undock: replace parent with sibling');
    }
    
    // Explicitly rebuild parent map after tree structure changes
    this.buildParentMap();
    
    // Log the result
    if (this._treeLoggingEnabled) {
      console.log('After undocking:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
      console.groupEnd();
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
    if (this._treeLoggingEnabled) {
      console.group('tryAdjoiningEmptyNodes');
      console.log('Node:', node);
    }
    
    if (!node || typeof node !== 'object') {
      if (this._treeLoggingEnabled) {
        console.warn('Invalid node passed to tryAdjoiningEmptyNodes');
        console.groupEnd();
      }
      return;
    }
    
    let parent = this.parentMap.get(node);
    
    if (this._treeLoggingEnabled) {
      console.log('Parent node:', parent);
    }
    
    if (!parent || !parent.split) {
      if (this._treeLoggingEnabled) {
        console.log('No parent or parent has no split, nothing to adjoin');
        console.groupEnd();
      }
      return;
    }
    
    // Make sure both child nodes exist before checking their windows
    if (parent.split.a && parent.split.b && 
        !parent.split.a.window && !parent.split.b.window) {
      
      if (this._treeLoggingEnabled) {
        console.log('Found two empty child nodes, removing split and moving up tree');
        console.log('Tree before adjoining:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
      }
      
      // Take note of whether this is potentially the root node
      const isRoot = parent === this.dockingTree;
      
      // Store a copy of the parent and the tree structure
      const oldParent = {...parent};
      const oldTree = JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v));
      
      delete parent.split;
      parent.window = null;
      
      // Rebuild the parent map after structure modification
      this.buildParentMap();
      
      if (this._treeLoggingEnabled) {
        console.log('Tree after adjoining:', JSON.parse(JSON.stringify(this._dockingTree, (k, v) => k === 'window' ? '[Window]' : v)));
        
        if (isRoot) {
          console.log('NOTE: Modified node was the root node');
        }
        
        // Check if the tree structure drastically changed
        const newIsEmpty = !this._dockingTree.split && !this._dockingTree.window;
        if (oldTree.split && newIsEmpty) {
          console.warn('⚠️ POTENTIAL ISSUE: Tree was reduced to an empty node when it shouldn\'t have been');
          console.trace();
        }
      }
      
      // Continue up the tree
      this.tryAdjoiningEmptyNodes(parent);
    } else if (this._treeLoggingEnabled) {
      console.log('Conditions for adjoining not met');
    }
    
    if (this._treeLoggingEnabled) {
      console.groupEnd();
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
   * Enables or disables detailed logging of docking tree changes
   * @param {boolean} enable - Whether to enable detailed logging
   */
  enableTreeChangeLogging(enable = true) {
    this._treeLoggingEnabled = enable;
    console.log(`Docking tree change logging ${enable ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Logs a tree change if logging is enabled
   * @param {string} operation - Description of the operation
   * @param {Object} oldTree - The tree before the change
   * @param {Object} newTree - The tree after the change
   */
  logTreeChange(operation, oldTree, newTree) {
    if (!this._treeLoggingEnabled) return;
    
    console.group(`Docking Tree Change: ${operation}`);
    console.log('Before:', JSON.stringify(oldTree, (key, val) => {
      if (key === 'window' && val) return '[Window Object]';
      return val;
    }, 2));
    console.log('After:', JSON.stringify(newTree, (key, val) => {
      if (key === 'window' && val) return '[Window Object]';
      return val;
    }, 2));
    console.log('Stack Trace:', new Error().stack);
    console.groupEnd();
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

  /**
   * Analyzes the docking tree structure and reports any issues
   * @returns {string} A report of the tree structure and any issues found
   */
  analyzeDockingTree() {
    console.group('Docking Tree Analysis');
    
    // Check if tree exists
    if (!this._dockingTree) {
      console.warn('No docking tree found');
      console.groupEnd();
      return 'ERROR: No docking tree found';
    }
    
    // Main tree info
    console.log('Tree structure:', this._dockingTree);
    console.log('Tree visualization:');
    console.log(this.printDockingTree());
    
    // Count nodes and windows
    let nodeCount = 0;
    let windowCount = 0;
    let emptyLeafCount = 0;
    let splitCount = 0;
    
    const countNodes = (node) => {
      if (!node) return;
      
      nodeCount++;
      
      if (node.window) {
        windowCount++;
      } else if (!node.split) {
        emptyLeafCount++;
      }
      
      if (node.split) {
        splitCount++;
        countNodes(node.split.a);
        countNodes(node.split.b);
      }
    };
    
    countNodes(this._dockingTree);
    
    console.log(`Node statistics: ${nodeCount} total nodes, ${windowCount} windows, ${emptyLeafCount} empty leaf nodes, ${splitCount} split nodes`);
    
    // Check for consistency issues
    const issues = [];
    
    // Check root node
    if (!this._dockingTree.split && !this._dockingTree.window) {
      issues.push('Root node is empty (no window and no split)');
    }
    
    // Check for orphaned windows
    const windows = Array.from(document.querySelectorAll('lively-window'));
    const dockedWindows = windows.filter(w => w.classList.contains('docked'));
    
    if (windowCount !== dockedWindows.length) {
      issues.push(`Window count mismatch: ${windowCount} in tree vs ${dockedWindows.length} with docked class`);
    }
    
    // Report issues
    if (issues.length > 0) {
      console.warn(`Found ${issues.length} issues:`);
      issues.forEach(issue => console.warn(`- ${issue}`));
    } else {
      console.log('No issues found in tree structure');
    }
    
    console.groupEnd();
    
    // Return a report
    return issues.length > 0 
      ? `Issues found: ${issues.join('; ')}` 
      : `Tree OK: ${windowCount} windows, ${splitCount} splits`;
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
