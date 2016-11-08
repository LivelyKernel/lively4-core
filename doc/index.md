# Lively Documentation

Lively4 is a self-supporting collaborative development environment. It runs in the browser on the client side and uses DOM elements and JavaScript as its building blocks. We use web-components and babels client side JavaScript source code transformation. It can be used and three ways:

1. It can be statically servered from a github.io page, from where it can be used to edit files on github and other cloud storage. We employ a custom service worker that provides use with a unified layer over the various cloud services and storage APIs. 
2. We also developed a thin node.js server that can clone github projects, serve their content and allow to edit them using each developers private github credentials.
3. We can load lively through a chrome extension on any third party page. Currently we loose some functionality such as the unified service worker file system that way. 

Lively4 is currently build using two materials: JavaScript modules and HTML Templates. 

# Templates

We provide a set of new HTML templates that can be loaded using ``lively.components.createComponent("lively-editor")`` or my using ``link`` tags directly. 
All components are stored together with their prototype definitions (JavaScript classes in a module) in the [templates](../templates/) directory. 

- [Lively Editor](../templates/lively-editor.html)
  - saveFile
  - loadFile
- Lively Container
- Lively Sync
  - sync
  - commit
  - squash [experimental]
    - squashes several commits into one
    - PROBLEM: Lively Editors rember commit hashes as lastVersion that will now not be available....
  - branch [experimental]


- Lively Server
  - auto commit
      - every writeFile produces a git commit that later can be squashed
      - 

# Modules

