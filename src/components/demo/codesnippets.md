# Project 3: Linus Heinzl and Anne Radunski  <br> *Petri Netze*

<!--
![](petrinet.png){width=200px, style="float:right"}
-->

- Motivation: Visual  Domain Specific Programming  
- Goal: Discuss and implement a simple Petri Net editor and simulator
- [Questions](questions.md)



- Links
  - [graffle](edit://src/client/graffle.js)


## Tasks

- Components: Pane, Node, Edge

```html
<petri-pane>
  <petri-node id="1"></petri-node> 
  <petri-node id="2"></petri-node> 
  <petri-edge from="1" to="2"></petri-edge> 
</petri-pane>
```

- Interaction
  - new node and edge via ContextMenu
  - drag node, edges moves with it
  - (re-)connect to nodes with edge

...

- load/save ... use lively standard 
- simulation


## Code Snippets  
  
```javascript
  this.style.borderRadius = "90px"
```

```javascript

import ContextMenu from 'src/client/contextmenu.js';

// ...

this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

// ...


onContextMenu(evt) {
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["clear", () => this.clear()],
              ["undo stroke", () => this.undoStroke()],
              ["redo stroke", () => this.redoStroke()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }

  }
```
  
  <lively-import src="petrinet.html" style="position:relative"></lively-import>
