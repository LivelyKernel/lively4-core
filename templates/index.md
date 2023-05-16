<link rel="stylesheet" type="text/css" href="../src/components/index-style.css"  />

# Web Components


<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>

## Research Diary
- research-diary  {.component}
- graph-control  {.component}
- add-knot  {.component}
- add-triple  {.component}
- knot-desktop-icon  {.component}
- knot-input  {.component}
- knot-search-result  {.component}
- knot-view  {.component}
- triple-list  {.component}
- triple-notes  {.component}
- tps-node  {.component}


## Misc 
- add-seminar-topic  {.component}
- bibtex-cleaner  {.component}
- d3-example  {.component}
- data-explorer  {.component}
- lively-codecompletion  {.component}
- run-remote-batch-script  {.component}
- smalltalk-squeakjs  {.component}
- template  {.component}
- test-blobby  {.component}
- test-test  {.component}
- trello-viewer  {.component}

## Seminars

- gh-explorer  {.component}
- github-explorer  {.component}
- lively-px18-force-layout  {.component}
- lively-px18-graph-drawing  {.component}
- lively-px18-simulated-annealing  {.component}
- semantic-source-code-navigator  {.component}


## *META*

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>