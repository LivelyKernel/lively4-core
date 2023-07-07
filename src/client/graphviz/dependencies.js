import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
/*MD
# Module Dependency Graph

![](dependencies.png){width=400px}

<browse://src/client/graphviz/dependencies.md>

MD*/

export default class ModuleDependencyGraph extends Graph {

  
  onSecondClick(evt, node) {
    lively.openBrowser(node.key, true)
  } 
  
  async getForwardKeys(node) {
    return lively.findDependentModules(node.key, false, true)
  }

  async getBackwardKeys(node) {
    return lively.findDependentModules(node.key, false, false)
  }

  initialize(parameters) {
    super.initialize(parameters)
    this.key = lively4url + "/src/client/fileindex.js" // default example
    if (parameters.url) {
      this.key = parameters.url
    }
  }

}
