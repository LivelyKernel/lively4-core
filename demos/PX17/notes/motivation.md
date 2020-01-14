
### Live Progarmming

``Live programming requires at a minimum some state snapshot, some re-execution of changed code, and some re-displaying of results''~\cite{Burckhardt2013IAC}

 - What is the Smalltalk, development experience?
     - debug-and-continue
     - live feedback when code under development is run contiuously any way
     - good place to experiment with single user development experience
 - What is the Lively Kernel Development Expierence and where does it differe from LK?
     - sometimes more file based (can be shadowed with right tool support)
     - more collaborative
     - better default text and graphics rendering vs. control over each pixel in Smalltalk
     - better access to libraries and services

- #TODO #Figure #LivelyKernelDevelopmentExperience
  - Code edits affect running system while context is preserved
  - Objects in running system can be explored and changed #NotInFocus
  - Changes to content and code are shared #Collaboration #NotInFocus

- It is possible to get immediate feedback during development and intact with objects through direct manipulation. 

### Web-components

- controlling Web Component instantiation allows us to use the latest templates and classes.
- explicit object migration, by instantiating a new object and migrating peristiable state and optionally calling ``livelyMigrate''.
