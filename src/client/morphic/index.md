# Morphic

The Lively4 morphic implementation. The main contribution of this module is, that there is actually no morphic module we have to implement. 

<!--
Treating every HTML element as morph we can use the Halo tools to [select](selecting.js), [drag](dragging.js), [grab](grabbing.js), [copy](copying.js), [resize](resizing.js), and [inspect](inspecting.js) all html content. These modules define the behavior used in the [user interface](/templates/halos/).

That said we provide our own root class for HTML elements we call [Morph](../../../templates/classes/Morph.js).
-->

- [component-creator.js](component-creator.js)
- [dragbehavior.js](dragbehavior.js)
- [component-loader.js](component-loader.js)
- [event-helpers.js](event-helpers.js)
- [events.js](events.js)
- [index.md](index.md)
- [node-helpers.js](node-helpers.js)
- [snapping.js](snapping.js)
- [selecting.js](selecting.js)


<script>
import Files from "src/client/files.js"
var md = lively.query(this, "lively-markdown");
Files.generateMarkdownFileListing(md.shadowRoot)
</script>