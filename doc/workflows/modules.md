# Modules

By using modern JavaScript modules (import/export), we can structure the project internally quite well. But integrating external projects and libraries into that world is still an #OpenProblem. Currently we use three approaches:

1. copy a self contained module into "/src/external"
  - pros: it is stable, and we can directly edit and debug them (e.g. insert "import" statements or customize them)
  - cons: they don't update themselves
2. clone whole other repositories as subtrees into our repository
  - pros: same as copy, and we can update them and push changes back
  - cons: 
    - not every repository has usable packages without building them first
    - can get pretty big 
3. use npm:
  - pros: 
    - is fast and updates itself
    - does not increase our source
    - can use building to actually produce something in usable in the browser
  - cons: 
    - hard to customize
    - requires npm on the "server" side

Modules:
- [lively](../src/client/lively.js) -> Our used to be kitchen-sink-god-class modules that has to be cleaned up after helping us in a time with needs
- ...
