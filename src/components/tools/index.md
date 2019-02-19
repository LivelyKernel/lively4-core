# Tool Web Components


<link rel="stylesheet" type="text/css" href="../index-style.css"  />

<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>

 - lively-ast-explorer {.component}
 - lively-component-bin  {.component}
 - lively-console {.component}
 - lively-container {.component}
 - lively-container-navbar {.component}
 - lively-editor {.component}
 - lively-file-browser {.component}
 - lively-file-browser-item {.component}
 - lively-filesystems {.component}
 - lively-help {.component}
 - lively-index-search {.component}
 - lively-inspector {.component}
 - lively-services {.component}
 - lively-services-item {.component}
 - lively-style-editor {.component}
 - lively-sync {.component}
 - lively-target-button {.component}
 - lively-testrunner {.component}
 - lively-version-control {.component}
 - lively-xterm {.component}

## Draft

- lively-analysis {.component}
- lively-analysis-heatmap {.component}
- lively-analysis-table {.component}

### Cloud Scripting
- lively-cloudscripting {.component}
- lively-cloudscripting-action-item {.component}
- lively-cloudscripting-configurator {.component}
- lively-cloudscripting-credentials {.component}
- lively-cloudscripting-file-browser {.component}
- lively-cloudscripting-item {.component}


# Deprecated

- lively-debugger {.component}
- lively-index-manager {.component}
- lively-cache-mounts {.component}
- lively-cache-viewer {.component}
- lively-search {.component}

## META

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>



