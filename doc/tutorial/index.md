# Tutorial


## Goals?

- Open applications and tools?
  - Workspace
  - Browser
- Where to start? Source code in files or working with objects?

- Create and edit a text element? #Objects
  - #ContextMenu > Insert > Text | Rectangle | Drawing | Button
  - in the body... only locally persisted?
  - in a file

- Edit elements with #Halo
  - grab | drag | copy | inspect | ..

- Edit a text file #Files
  - markdown, html, JavaScript

- create and work together on a lively4 web component
- create and work on a JavaScript module




## ...



- What is a "Web Component"

```html
<html>
  <h1>My Website</h1>
  <div>This is a standard html element</div>
  <!-- and the next one is a custom web componenent -->
  <my-web-component id="foo" valu="5">
     <span>This node is a child</span
  </my-web-component>
</html>
```
We use Web-components to create tools and applications directly in the Web-browser. 

So lets start:


- Create a new component using a ["wizzard"](../../templates/index.html) 
- this will create two files:
  a) a html file containing a template
  b) a js file containing a module exporting a subclass of ``HTMLElement``

# Things we should say somewhere:

- Ctrl-Shift-F - search throughout whole repository.

- Persistence indicator, when explaining persistence of objects/html elements
