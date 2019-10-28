# Onboarding

<lively-import src="https://lively-kernel.org/lively4/aexpr/doc/_navigation.html"></lively-import>


## Guides

- [Lively API](lively.md)
- [Web components](web-components.md)
- [Keyboard Shortcuts](./../manual/shortcuts.md)
- [Creating a Web Component](./creating_a_web_component.md)
- [Test-driven Development (using Active Expressions as example)](./reactive/tdd_for_aexprs.md)



# Overview

## Flavors and Workflows

- [Node.js server](https://lively-kernel.org/lively4/lively4-core/)
- Github.io #deprecated
- Chrome extension 
  - Customize Page (Context Menu) 

## Tools 

### File based

- File Editor / Browser -> Lively Container
- Sync Tool (update, commit and push to githhub)
- Mount (access to cloud storage)
  - Service Worker provides virtual file system
- File Search 
- Index Search (SELECT+CTRL+SHIFT+F)
  - combine client, cloud and server based index over user files
- Test Runner 
  - runs our (to few) mocha tests locally 

### Runtime

- Halo 
- Workspace -> Just for Snippets
- Object Editor (work in progress -> for scripting and inspecting live objects)
- Component Bin

## Experimental

- Services 

## Documentation

- Devdocs -> Generic JavaScript, CSS, DOM Manuals (SELECT+CTRL+SHIFT+H)
- Journal (our developer journal)
- Lively4 Wiki (browse and edit github based Wiki)
- Issues (open github issue page)


# TODOs

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

# Things we should say somewhere:

- F7 switches between .js and .html file of a web component
- `Strg-Drag` on body/background to navigate the lively world
- Persistence indicator, top right corner, when explaining persistence of objects/html elements
