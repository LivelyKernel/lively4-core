# Hooks 

Lively components (HTML elements) can implement hooks to better integrate into the environment.

## livelyInspect

Allows to customize the [lively-inspector](searchfilename://lively-inspector.js).

```javascript
class Selection {
  livelyInspect(contentNode, inspector) {
    var selection = <div class="element"><i>selection</i></div>
    contentNode.appendChild(selection)
    this.nodes.forEach(ea => {
      selection.appendChild(inspector.display(ea, false, null, this));
    })
  }
}
```