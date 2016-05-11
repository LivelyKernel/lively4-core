# Morphic

The Lively4 morphic implementation. The main contribution of this module is, that there is actually no morphic module we have to implement. Treating every HTML element as morph we can use the Halo tools to [select](selecting.js), [drag](dragging.js), [grab](grabbing.js), [copy](copying.js), [resize](resizing.js), and [inspect](inspecting.js) all html content. These modules define the behavior used in the [user interface](/templates/halos/).

That said we provide our own root class for HTML elements we call [Morph](../../../templates/classes/Morph.js).
