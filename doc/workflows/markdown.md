# Markdown

[demos](../../demos/markdown/index.md) | [architecture](../architecture/markdown.md)

### Source View Projection

Markdown *Source* and *View* are connected through line based source maps in HTML elements, allowing various editing support:

- While editing markdown source the HTML element is highlighted #Feature
- *SHIFT-Click* (or context-menu "edit source") on a HTML element in the markdown view will show the corresponding source line #Feature

### Inline Source Editing in View

Context-menu "edit" on a HTML element inside a markdown view in a container will allow to edit the partial source of that element and save the file, updating only that part of the source and keeping the rest of the file intact. 


### Markdown in JavaScript Comments

We support special markdown (and HTML) comments for embedding rendered content in JavaScript files. The markdown content can be used to structure and document files. E.g. add headings, links and embed images. 

This looks something like this:

![](media/markdown-comments-view.png){width=600}

Pressing `Alt-P` allows to edit the markdown source:

![](media/markdown-comments-source.png){width=600}

You can achieve some interesting [inception experience](edit://demos/javascript/inception.js) with it. 