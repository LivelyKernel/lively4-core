
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



### Cutout


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
