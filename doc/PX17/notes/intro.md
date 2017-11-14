
- #Domain Live programming of tools and application in the browser
    - #Lively4 as a programmable shell for the Web
    - shell: combination of scripting and UI, where programming is a form of UI 
- #Problem Directly (re-)use and work with content and libries available in JavaScript/HTML/CSS ecosystem 
- #Approach Combine Lively Kernel UX with Web technologies
    - Design, development and evaluate in evolving self sustaining system: Lively4
    - Programming model: morphic objects -> Web Componets
    - Rational: some limits make are needed to make it easier to build tools and workflow
- #Discussion Problems with working on object graph: serialzation, collaboration, ... on an on #NotInThisPaper
- #Contribition Replace working/worrying about objects in with working just with HTML elements again... -> new challenges... no references, e.g. but fits nicely into a distributed world of JSON serverices... there are no (implicit) object references anyway.

- We want to program at run-time to get immediate feedback
- We want to evolve tools and applications while we are using them %% #Problem #PreservationOfContext
- We want to benefit from modern Web technologies to write better JavaScript. %% Web Components 
- We want to be able to use our lively tools (to some degree) on external libraries and components
- Idea: our (graphical objects have a notion of persistent state (attributes) that are kept during development and transient state (object properties) that will be thrown away or updated as needed. 
- In short: when applications can persists their state, we can (in principle) do live development by loading the old state into a system with the new code. %% #Replay with one huge step
- #StateOfTheArt - game development with save games vs. having to replay to interesting state
- keeping the save gamges compatible is challenge both for game modders and developers of extensions and patches
- #TODO introduce running example bouncing ball / soap bubble.... 
Evalutation: We bould tools in Lively4 with our approach
- Live programming a retained UI for the common “retained” UI, ``where a program builds and modifies a tree of widget objects to be rendered, changing the code that initially builds this widget tree is meaningless as that code has already executed and will not execute again!''~\cite{Burckhardt2013IAC}
