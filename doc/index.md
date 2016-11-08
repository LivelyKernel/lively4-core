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
  - squash
    - squashes several commits into one
  - branch [experimental]


- Lively Server
  - auto commit
      - every writeFile produces a git commit that later can be squashed
      - 

# Modules

- [lively](src/client/lively.js) -> Our used to be kitchen-sink-god-class modules that has to be cleaned up after helping us in a time with needs
- 

# Development

- Issues
- Repositories
- Libraries 
  - Problematic: npm --> problematic, because it does not work with github.io
  - Problematic: ../some-relative-repository (on lively-kernel.org) --> problematic, ... see above
  - OK: static copies of (potentially minified) libraries
  - Best: github repositories subtrees, statically available, but still updateable
    - FEATURE: allows for local adaptation, without giving up, updateabiltiy 
    - #TODO -> provide tool support from inside lively4 to add, update, remove such dependencies
  - Do you have a favorite module/library/package/dependency management system that works clientside only?

# Other Documentation
- [Lively4 Wiki on Github](https://lively-kernel.org/lively4/Lively4.wiki/Home.md)
- that also hosts our [developers journal](https://lively-kernel.org/lively4/Lively4.wiki/Journal.md)
