
import GraphNode from './graph-node.js';
import AENodeExtension from './ae-node-extension.js'
export default class AExprNode extends GraphNode {
  
  constructor(aexpr, graph, nodeOptions = {}, identifierSymbol) {
    super(graph, nodeOptions);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "2"
    this.aexpr = aexpr;
    this.extensions.push(new AENodeExtension(graph, this, aexpr));
    this.identifierSymbol = identifierSymbol;
  }
  
  isVisible() {
    return this.visible;
  }
  
  getInfo() {
    const data = [];
    const location = this.aexpr.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(this.identifierSymbol + " " + locationText);
    } else {
      data.push(this.identifierSymbol + " " + this.aexpr.id);
    }

    data.push(this.aexpr.getSourceCode(-1, false) + "\n");
    return data;
  }
}