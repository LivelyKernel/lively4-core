
import GraphNode from './graph-node.js';
import AENodeExtension from './ae-node-extension.js'
export default class AExprNode extends GraphNode {
  
  constructor(aexpr, graph, nodeOptions = {}) {
    super(graph, nodeOptions);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "2"
    this.aexpr = aexpr;
    this.extensions.push(new AENodeExtension(graph, this, aexpr));
  }
  
  isVisible() {
    return this.visible;
  }
  
  getInfo() {
    const data = [];
    data.push(this.aexpr.getName());
    data.push(this.aexpr.getSourceCode(-1, false) + "\n");
    return data;
  }
}