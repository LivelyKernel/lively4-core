# User Stories #BrainDump

- Story Estimation in relative points: 1P, 2P, ... ?P (simple to unknown)
- What to do with this list?
 - take the first, implement it and repeat.
 - Extract suitable seminar/master thesis topics
 - Bring it to github and sync establish bidirectional connection via issue tag #123

## Lively UI

- save as selection 1P
- save img/png not as html but as files (e.g. resolves data urls)
- fix position on grab and drop 2P #Issue
- lively.prompt dialog missing 3P 
- paste directly into container 2P
- rename halo item with inplace input field

## Lively UX

- benchmark all startup times local storage? 1P
- detailed benchmark loading times incl. service worker, compilation, component loading etc
- benchmark lively UI .. dragging / menu open / how much content on a page etc... 

## Lively Tools

- all tools should be opend first globally 0.5P #BUG
- Refactor juicy-ace-editor to code-mirror #Refactoring
  - make Hashtags navigateable (all text and source code)
  - autocompletion of import packages
  - preview / hide image tags and specially img tags with data url in markdown/html/javascript
  - allow inlide lively svg handwritten notes in markdown/html/javascript
- create style editor for text and other objects...
- sort properties in inspector to private / html element / custom ... to find your data faster #Inspector

## Lively Content

- fast rich(er) text editing
- change font size in halo and style editor
- auto-shrinking of text?
- refactor container
 - extract navigation pane 3P
 - extract multple content type viewer (without editing) 3P
- push back edits markdown files (inplace) from rendered HTML back to Markdown source 
  - fix markdown issues e.g. lists under lists
- make halo grabbed/dropped content lively-content
- connectors disappear when 90deg #TODO 

- write multiple "lively-scripts" in one document #BUG

## Lively Chrome Extension

- upload latest version to google app store
- update stable version
- write document supporting extensions 
 - Disable Content-Security-Policy 1.0.6
 - Ignore X-Frame headers 1.1

## Lively Client 

- provide code <-> ast functionality (lively.code) 2P #Feature
  - build Smalltalk-like Source Code Browser that edits methods #Features (showcase for code are not just  characters in a file) simple #ProjectionalEditor
- access github issues through workspace / API 5P
- make github stories a filesystem  16P
  - format for file
  - delete/create file
  - what is filename?  What is id?
- allow links to github stories tags #123  e.g. useable in this list 
  - the repository should be defined in the context and not the link
  - explicit global links should be possible
- use story tags in commit messages

## Lively Container




## Student Projects

- build a gallery 10P
- was there anything more? 
- new topics? 8P

## Lively Service Worker

- make booting it fast
- make booting it reliable (don't let the browser handle your requests)
- user caching for getting and putting resources (see offline first)

## Lively Services

- put lively services into sandbox (use heroku) and create usable example 10
- quick lively termeinal (example usecase)
- deploy lively4-server as lively-service
- playback local media center #Jens #Example #Hobby 

## Lively4-server

- remove absolute urls / paths #Refactoring
- remove dependency on bash scripts? Or make it explicit (e.g. linux subsystem for windows is needed)

## Lively Debugger
- revisit lively debugger 10P
  - (main issue: starting time to long and fragile)
  - publish chrome extensiosn 2P

## Lively Sync

- Trasher-like splitting of commits

## Lively PDF

- make pdf work again 3P
- create link that opens lively-pdf when pasting pdf urls 1P
- allow to persistently anntate pdfs (have a look at Hypothesis) ??P
- write back anntations into file ??P


## Lively Drag and Drop
- create links (and optionally open container) for arbitrary browser drag and drop API ?P
- provide hooks ourselve that can be dragged and drop (onDragStart, onDrag, onDragEnd) ?P

## Misc Issues:
- to many green helper lines
- no backup of local lively content combined with auto-save can make an explosive mixture #TODO
- unwanted world scrolls (in panning code)
- data-urls in markdown are broken
  - side effect of "fixing" links
  - remove absolute positioning 

## Text Editor

- We need rich text editor
- We neee spelling-corrector everywhere

## Lively Tag and Search 

- Connect all content via #tags and search...
- Make structured search  possible
 - Methods, Classes, Modules
 - Headlines, Text, Nodes
 - Handwriting
- fast through caching content and meta-information (prototyped with #Dexie and [TODO pages](../todo.html)

## Lively Graffle

- provide a graffle like whiteboard feeling text/shape/connectors #WIP


## Write a #Lively4Paper

- what was/is our motivation?
- document our design desciions
- evaluate our design decisions
- what is open? Where do we want to go?

## Old Stories

- make local storage file system #ServiceWorker
- Undo for content editing
- Offline first 
  - be abler to load lively without internet
  - work for a while
  - synchronize with repository
  - idea: JavaScript github client | or just files... 
- Source Code transformation on Syntax level ?P
- find a module system system for external dependencies...?P 
  - (unpkg npm, bower, and all the rest)
  - how to write it in JavaScript and module configuration per project needed? 
  - right granularity is difficult
  - deployment vs. development
  - minimized vs. debuggability
  - RW: lively-packages (Robert Krahn)
- benchmark: 10.000 Morphs, 60fps
- Pen-based handwriting recognition 
- white boardf on surface hub (multiple user one device scenario) ?P
- UI editor for web components (prototype based editing)
- Reimplement object editor
- Change History of methods
- Fast COP
- Collaborative Lively Session (Synchronous) RW: Webstrates
- Annotations for classes/methods (public/private)
- event system / bindings are missing (use lively bindings again) current: new CustomEvent(...)
- write paper (section) about: heap vs document persistens #Lively4Paper
- Lively Software Viz Current: Only Module 
- Energy Simulation
- Diffing and merging  (object/graph/heap vs. text/tree/document) #Lively4Paper #FutureWork

 
  



