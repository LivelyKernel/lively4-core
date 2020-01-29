# Objects

All objects are created equal, but some are more equal than others!

In Smalltalk and earlier versions of Lively Kernel the "Object" is the main player in world of objects. All objects are automatically persisted in a "soup" of objects referencing each other by writing main memory onto the hard disk. In Lively Kernel, we emulated this behavior by serializing all objects into a linear list of JSON stubs with explicit references. We could only start to render a page after all objects were loaded and fully deserialized. Now we do things differently! Because we put more the HTML Elements (sometimes encoded as Markdown) in the center of our attention, because trees are much easier to work with than graphs... 


## Working with browser  **local content**: 
- Play around with objects and in [workspace](../toos/codemirror.md)
- Alt-click for [Halo](../tools/halo.md) and [context menu](../tools/context-menu.md)
- Content is [locally persisted](edit://src/client/persistence.js#saveLivelyContent) in browser localStorage
