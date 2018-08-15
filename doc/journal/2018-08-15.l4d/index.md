# 2018-08-15 #L4D #Lively4Documents

So, instead of embedding content directly into one file and having the #CodeMirror deal with it... we can opt for making our "documents" not single files, but bundle them into a directory. This breaks compatibility with other mechanisms, like drag and drop, but since we are in control of it, be should be able to deal with it....

<lively-import src="https://lively-kernel.org/lively4/lively4-jens/doc/journal/2018-08-15.l4d/example1.html"></lively-import>

This also makes the markdown files lean again and introduces boundaries in the object view.

To make such a workflow work, we have now several issues:

- allow to "rename" directories: lively4-server should be able to rename files and directories
- allow to "extract as import" to replace an html node / or figure with an import.... introducing a new border
- the navbar should not immediately go into "file.l4d" directories... #done
- convert md to l4d file

# Drag and Drop

- Problem: finding the right drop target, e.g. dropping something into an shadow root
  -> only on global (or specially marked objects)
- automatically wrapping content into elements and deleting them leads to garbage lying around