# Editor

[**js**](edit://src/components/tools/lively-editor.js) | [**html**](edit://src/components/tools/lively-editor.html) | [**open**](open://lively-editor)

Our editor wraps around our code-mirror component and can load and save files (urls). It knows about the versions of the files you are editing and will solve conflicts when saving. It will also try to update other editors on that same file to avoid loosing text or creating unnecessary merge conflicts. 


![](../../src/components/tools/lively-editor.png){width=500px}


# Container / Editor / Code Mirror
 
![](..//figures/editors.drawio)


# Container Editor API

The container uses different editors to edit different kinds of resources:

- text and source code: lively-editor
- images: lively-image-editor
- source code with examples: babylonian-programming-editor


The container uses the following API:

- awaitEditor
- doSave
- getDoitContext
- enableAutocompletion
- ...