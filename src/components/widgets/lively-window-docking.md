
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
  