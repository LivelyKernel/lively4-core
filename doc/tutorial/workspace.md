


## Workspace

<script>
function open(evt) {
  lively.openWorkspace("", lively.getPosition(evt));
}
<button click={open}>Open Workspace</button>
</script>


## Context Menu

<script>
import ContextMenu from 'src/client/contextmenu.js';
function open(evt) {
  ContextMenu.openIn(document.body, evt);
}
<button click={open}>Open Context Menu</button>
</script>

## Halo


<div style="width: 200px; height: 100px; border: 1px solid black; background-color: rgba(40, 40, 80, 0.5); left: 1541px; top: 171.5px;" class="lively-content"></div>


Alt+Left-Click:

- Frequently clicking on the Halo reveals the parent of clicked element in DOM hierarchy.
- Alt+Shift+Left-Click
