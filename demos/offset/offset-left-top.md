# Use Case for `offsetTop` and  `offsetLeft`

For [https://bugs.chromium.org/p/chromium/issues/detail?id=1334556]()

This is a 'minimal' use case for the old behavior of `offsetTop` and  `offsetLeft`: we have a graph editor that is a web component and includes a pannable and zoomable canvas. Nodes with ports can be moved around. Edges between ports should stay anchored at the positions of their connected port's knobs, even if nodes get moved around. To calculate the correct position, we use the [**`boundsForElement`**](edit://templates/offset-mini-editor.js#boundsForElement) method, which returns the bounds of the given element relative to the local, transformed canvas, called `zoomInner`:

```javascript
boundsForElement(element) {
  const zoomInner = this.zoomInner;
  let bounds = rect(pt(0, 0), lively.getExtent(element));
  let parent = element;

  do {
    bounds = bounds.translatedBy(pt(parent.offsetLeft, parent.offsetTop));
  } while ((parent = parent.offsetParent) && parent !== zoomInner);

  return bounds;
}
```

The above method walks up the `offsetParent` chain until it reached `zoomInner` and accumulates the offsets, using `offsetTop` and `offsetLeft`. We then use the bound's center to calculate the edge's start and end position.

Compare the old behavior of `offset*` (Chrome up to V103) to the new one (Firefox) using the following example (*left-drag* to move nodes | *right-drag* to pan | *scroll* to zoom):

<script>
let editor;
(<offset-mini-editor id='offset-editor' />)
  .then(async e => (editor = e, await e.livelyExample(), e))
  .then(e => <div style='width: 500px; height: 400px; border: 1px solid gray;'>
      <div style='position: absolute; width: 500px; height: 400px; overflow: hidden;'>
        {e}
      </div>
    </div>
    );
</script>

(In Firefox, zoom out until you see the edge if necessary.)

The old, *composed* `offset` behavior includes transformed elements inside shadow roots, making this behavior even possible. The new behavior (tested in Firefox) skips the shadow root, thereby displacing the edge's start and end position in unintended ways.

Currently, we are unsure how to reproduce the old, `composableOffset*` behavior (if its possible at all).

#### One Idea

Stopping the traversal of `offsetParent`s using the following code in the loop of  [**`boundsForElement`**](edit://templates/offset-mini-editor.js#boundsForElement)...

```javascript
if (!lively.ancestry(parent).find(p => p.tagName === 'OFFSET-MINI-EDITOR')) {
  break;
}
```

...seemed to work at first.

You can activate this behavior globally here:

<script>
lively.sleepUntil(() => editor, 15000, 100).then(async editor => {
  return <div>
    <button click={() => {
      self.breakOnEditor = true
      editor.rerenderEdges()
    }}>break on editor</button>
    <button click={() => {
      self.breakOnEditor = false
      editor.rerenderEdges()
    }}>disable</button>
  </div>
})
</script>


However, this solution only works if no further displacement of `#zoom-inner` is happening in the shadow root of the editor. You can generate such a scenario by pressing the buttons below to set the `top` style property of `#zoom-outer`. Notice, how the edge gets displaced in unintended way when choosing a value bigger that 0 (new behavior only).

<script>
lively.sleepUntil(() => editor, 15000, 100).then(async editor => {
  
  return <div>{lively.elementPrinter.tagName.id.classes(editor.zoomOuter)}.style top: {...[0, 20, 50].map(n => <button click={() => {
      editor.style.setProperty('--outer-top', n + 'px')
      editor.rerenderEdges()
    }}>{n}px</button>
  )}</div>
})
</script>

<script>
<button click={() => {
  [...editor.querySelectorAll('offset-mini-port')].map(port => port.knob).forEach(knob => editor.showRect(editor.boundsForElement(knob)))
}}>Highlight knob bounds</button>
</script>

#### Call to Action

With the new `offset` behavior lingering in our future, we appreciate any viable alternative.

If you have an idea and want to try it out, you can easily adapt the [**`boundsForElement`**](edit://templates/offset-mini-editor.js#boundsForElement) by just clicking the link to change the behavior in a live programming setting, so any editor should update immediately.

#### Relevant Files

I tried to minimize the code as much as possible, while still trying to illustrate our issue in a plausible, real-life-ish use case instead of a toy example.

- this example
[ [**md**](edit://demos/offset/offset-left-top.md) ]
- offset-mini-editor
[ [**js**](edit://templates/offset-mini-editor.js) | [**html**](edit://templates/offset-mini-editor.html) | [**open**](open://offset-mini-editor) ] (for a more complex example, you can comment in the `div#displacer` in the [.html](edit://templates/offset-mini-editor.html))
- offset-mini-node
[ [**js**](edit://templates/offset-mini-node.js) | [**html**](edit://templates/offset-mini-node.html) | [**open**](open://offset-mini-node) ]
- offset-mini-port
[ [**js**](edit://templates/offset-mini-port.js) | [**html**](edit://templates/offset-mini-port.html) | [**open**](open://offset-mini-port) ]
- offset-mini-edge
[ [**js**](edit://templates/offset-mini-edge.js) | [**html**](edit://templates/offset-mini-edge.html) | [**open**](open://offset-mini-edge) ]

#### Editing Source Code in Lively

- Ctrl-S to save, live reload applies
- F7 to switch between `.js` and `.html` files of the same component

#### DOM Structure

- offset-mini-editor
  - shadowRoot{style="color: gray;"}
    - zoom-outer
      - zoom-inner
        - slot
  - offset-mini-node
    - shadowRoot{style="color: gray;"}
      - slot
    - offset-mini-port
      - shadowRoot{style="color: gray;"}
        - \#knob
  - offset-mini-edge

#### Variations on Parent Chains

The following table shows which elements are includes when using various parent element traversal techniques.

<script>
import TopologicalSort from 'demos/offset/topological-sort.js';

function flatTreeParent(element) {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }
  if (element.parentNode instanceof ShadowRoot) {
    return element.parentNode.host;
  }
  return element.parentNode;
}

function iterateParents(element, accessor) {
  let parent = element;
  const parents = []
  do {
    parents.push(parent)
  } while (parent = accessor(parent));

  return parents;
}

lively.sleepUntil(() => editor, 15000, 100).then(async editor => {
    const port = await lively.waitOnQuerySelector(editor, 'offset-mini-port')
    
    // important for offsetParent
    await lively.sleepUntil(() => {
    const flatTree = iterateParents(port, flatTreeParent);
      return flatTree.includes(document) && flatTree.find(p => p.localName === 'lively-markdown')
    }, 15000, 100);

    const knob = port.knob

    const parentLists = [
      {
        name: 'offsetParent chain',
        list: iterateParents(knob, e => e.offsetParent)
      },
      {
        name: 'flatTree chain',
        list: iterateParents(knob, flatTreeParent)
      },
      {
        name: 'custom events (lively.ancestry)',
        list: lively.ancestry(knob)
      },
      {
        name: 'lively.allParents',
        list: lively.allParents(knob)
      },
      {
        name: 'lively.allParents(..., deep)',
        list: lively.allParents(knob, undefined, true)
      }
    ];
    const allElements = parentLists.flatMap(p => p.list).uniq();

    const sortOp = new TopologicalSort(new Map());
    allElements.forEach(e => sortOp.addNode(e, e));
    parentLists.forEach(pl => pl.list.reduce((e1, e2) => (sortOp.addEdge(e1, e2), e2)));
    const sortedElements = [...sortOp.sort().keys()];

const maybeError = fn => {
  try {
    return fn();
  } catch (e) {
    return e
  }
}

    return <table>
      <thead>
        <td></td>
        {...parentLists.map(pl => <td style='writing-mode: vertical-lr;'>{pl.name}</td>)}
        <td style='writing-mode: vertical-lr;'>offsetLeft</td>
        <td style='writing-mode: vertical-lr;'>offsetTop</td>
      </thead>
      {...sortedElements.map(e => {
        return <tr>
          <td>{lively.elementPrinter.tagName.id.classes(e)}</td>
          {...parentLists.map(pl => {
            const isIncluded = pl.list.includes(e);
            const color = 'color: ' + (isIncluded ? 'green' : 'red')
            const text = isIncluded ? 'yes' : 'no'
            return <td><span style={color}>{text}</span></td>
          })}
          <td>{maybeError(() => e.offsetLeft)}</td>
          <td>{maybeError(() => e.offsetTop)}</td>
        </tr>
      })}
    </table>
  })
</script>

So, we have access to the appropriate elements, but fail to read the data we need.
