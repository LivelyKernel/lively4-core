import Morph from 'src/components/widgets/lively-morph.js';
import { pt, rect, Rectangle } from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {


  async initialize() {
    lively.notify("Initialize window docking", name);
    lively.windowDocking = this;

    this.classList.add("lively-content")

    // @TODO keyboard shortcuts to dock focused window
    // @TODO compatibility with tabs (ex: drag tab out of docked window)

    // This won't work because we need to be able to split both directions.
    // {split: {dir: left, pos: 0.5, left: {split: {dir: top, pos: 0.5, left: {window: null}, right: {window: xyz}}}, right: {window: null}}}

    // So we could use this as an example of a one-off docked window to the right
    // The attributes are for easier understanding
    // {dir: left, pos:0.5, left: {window: null, }, right: {window: xyz}}

    // There exist two node types:
    // - Split Node
    // - Leaf Node (contains window or empty)

    // For example, a big fullscreen would mean:
    // {window: [window object or id]} (thats it)
    // If you want to then split a window abc with window xyz, it would then be:
    // {split: {dir: left, pos:0.5, left: {window: abc}, right: {window: xyz}}}

    // RULES: EVERY LEAF NODE HAS WINDOW OBJECT
    // SPLIT NODES CANT HAVE A WINDOW OBJECT

    // DIFFERENCES TO IMGUI
    // In general, I have not found a good example for the ImGuiDockBuilder. It is clear that is has the following properties as well:
    // dock node (to 8 directions, either edge or corner (how would this work here?))

    // In Imgui (at least on the practical examples I see), there is a shortcut to "split to front" using the root of the tree, creating a new root. Is that really necessary? Also, the previous windows dont really change in size but rather adapt. Not sure about this sizing policy

    // @TODO can we do minimum pixel sizes to adjust splits when resizing? -> Apply constraint solver (like Cassowary with Apple)

    // fullscreen example:
    // {window: xyz}

    // split coordinates go 0 - 1, relative 

    // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
    this.adjustBoundingHelpers();

    lively.removeEventListener("docking", window, "resize")
    lively.addEventListener("docking", window, "resize", evt => this.onResize(evt))
  }
  
  convertWindowIdToWindow(node) {
    let newNode = {};
    let win = null;
    if (node.windowId) {
      win = lively.elementByID(ea.windowId);
    }
    newNode.window = win;
    if (node.split) {
      newNode.split = {};
      newNode.split.dir = node.split.dir;
      newNode.split.pos = node.split.pos;
      if (node.split.left.windowId) {
        newNode.split.left = this.convertWindowIdToWindow(node.split.left);
      }
      if (node.split.right) {
        newNode.split.right = this.convertWindowIdToWindow(node.split.right);
      }
    }
    return newNode;
  }

  convertWindowToWindowId(node) {
    let newNode = {};
    if (node.window) {
      newNode.windowId = lively.ensureID(ea.window);
    }
    if (node.split) {
      newNode.split = {};
      newNode.split.dir = node.split.dir;
      newNode.split.pos = node.split.pos;
      newNode.split.left = this.convertWindowToWindowId(node.split.left);
      newNode.split.right = this.convertWindowToWindowId(node.split.right);
    }
    return newNode;
  }

  refreshParentMap(node) {
    if (node.split) {
      this._parentMap.set(node.split.left, node);
      this.refreshParentMap(node.split.left);
      this._parentMap.set(node.split.right, node);
      this.refreshParentMap(node.split.right);
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
    this._dockingTree = tree;
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
  getLeftBoundary(split, boundary) {
    switch (split.dir) {
      case "top":
        return rect(boundary.left(), boundary.top(), boundary.getWidth(), boundary.getHeight() * split.pos);
      case "bottom":
        let leftPartForBottom = boundary.getHeight() * split.pos;
        return rect(boundary.left(), boundary.top() + leftPartForBottom, boundary.getWidth(), boundary.getHeight() - leftPartForBottom);
      case "left":
        return rect(boundary.left(), boundary.top(), boundary.getWidth() * split.pos, boundary.getHeight());
      case "right":
        let leftPartForRight = boundary.getWidth() * split.pos;
        return rect(boundary.left() + leftPartForRight, boundary.top(), boundary.getWidth() - leftPartForRight, boundary.getHeight());
    }
  }

  getRightBoundary(split, boundary) {
    switch (split.dir) {
      case "bottom":
        return rect(boundary.left(), boundary.top(), boundary.getWidth(), boundary.getHeight() * split.pos);
      case "top":
        let leftPartForTop = boundary.getHeight() * split.pos;
        return rect(boundary.left(), boundary.top() + leftPartForTop, boundary.getWidth(), boundary.getHeight() - leftPartForTop);
      case "right":
        return rect(boundary.left(), boundary.top(), boundary.getWidth() * split.pos, boundary.getHeight());
      case "left":
        let leftPartForLeft = boundary.getWidth() * split.pos;
        return rect(boundary.left() + leftPartForLeft, boundary.top(), boundary.getWidth() - leftPartForLeft, boundary.getHeight());
    }
  }

  // @REFACTOR
  getBoundsForNode(target, current, boundary) {
    if (current === target) {
      return boundary;
    }
    if (current.split) {
      let leftBounds = this.getLeftBoundary(current.split, boundary);
      let leftNodeBounds = this.getBoundsForNode(target, current.split.left, leftBounds);
      if (leftNodeBounds) return leftNodeBounds;
      let rightBounds = this.getRightBoundary(current.split, boundary);
      let rightNodeBounds = this.getBoundsForNode(target, current.split.right, rightBounds);
      if (rightNodeBounds) return rightNodeBounds;
    }
    return null;
  }

  resizeWindowsInSlot(node, boundary) {
    if (node.window) {
      node.window.dockTo(this.dockingRectToClientRect(boundary));
    }
    if (node.split) {
      this.resizeWindowsInSlot(node.split.left, this.getLeftBoundary(node.split, boundary));
      this.resizeWindowsInSlot(node.split.right, this.getRightBoundary(node.split, boundary));
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
    let helpers = this.shadowRoot.querySelectorAll('.helper-fixed');

    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));

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

  // assumption: rect(x,y,width,height)
  clientRectToDockingRect(clientRect) {
    return rect(clientRect.left() / window.innerWidth, clientRect.top() / window.innerHeight, clientRect.getWidth() / window.innerWidth, clientRect.getHeight() / window.innerHeight);
  }

  dockingRectToClientRect(dockingRect) {
    return rect(dockingRect.left() * window.innerWidth, dockingRect.top() * window.innerHeight, dockingRect.getWidth() * window.innerWidth, dockingRect.getHeight() * window.innerHeight);
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
    if (node.split) {
      if (this.getLeftBoundary(node.split, currentBoundary).containsPoint(dockingCoords)) {
        return this.getLeafNodeForDockingCoords(dockingCoords, node.split.left, this.getLeftBoundary(node.split, currentBoundary));
      } else {
        return this.getLeafNodeForDockingCoords(dockingCoords, node.split.right, this.getRightBoundary(node.split, currentBoundary));
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
      return {split:{dir: currentNode.split.dir, pos: currentNode.split.pos, left: this.replaceNodeInDockingTree(currentNode.split.left, targetNode, replacement), right: this.replaceNodeInDockingTree(currentNode.split.right, targetNode, replacement)}};
    }
    return currentNode;
  }

  async applyDockingToWindow(dockingType, newWindow) {
    if (!this.currentDockingNode) return;
    let clientBounds = this.dockingRectToClientRect(this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1)));

    if (dockingType == "center") {
      if (this.currentDockingNode.window) {
        this.currentDockingNode.window = await newWindow.tabIntoWindow(this.currentDockingNode.window);
      } else {
        this.currentDockingNode.window = newWindow;
      }
      this.currentDockingNode.window.dockTo(clientBounds);
      return;
    }

    const availableTypes = ["top", "left", "bottom", "right"];
    if (!availableTypes.includes(dockingType)) {
      lively.error("Invalid docking type");
      return;
    }

    // Replace the node in the tree that "currentDockingNode" was pointing to
    this.dockingTree = this.replaceNodeInDockingTree(this.dockingTree, this.currentDockingNode, {split:{dir: dockingType, pos: 0.5, left:{window: newWindow}, right: this.currentDockingNode}});
    
    this.resizeWindowsInSlot(this.dockingTree, rect(0,0,1,1));
    
    /* TODO only resize windows in affected slots for performance
    let slotBounds = this.getBoundsForNode(this.currentDockingNode, this.dockingTree, rect(0,0,1,1));
    debugger;
    if (!slotBounds) {
      lively.warn("Could not find any bounds for current docking node");
      console.log(this.dockingTree);
      console.log(this.currentDockingNode);
    }
    //this.resizeWindowsInSlot(this.currentDockingNode, slotBounds);
    */
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
      let maybeLeftNode = this.findNodeOfWindow(node.split.left, window);
      if (maybeLeftNode) return maybeLeftNode;
      let maybeRightNode = this.findNodeOfWindow(node.split.right, window);
      if (maybeRightNode) return maybeRightNode;
    }
    return null;
  }

  undockMe(win) {
    let myNode = this.findNodeOfWindow(this.dockingTree, win);
    if (!myNode) return;
    myNode.window = null;
    this.tryAdjoiningEmptyNodes(myNode);
  }

  // @TODO
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
    //debugger;
    let parent = this.parentMap.get(node);
    if (!parent) return;
    if (!parent.split.left.window && !parent.split.right.window) {
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
