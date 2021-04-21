
import GraphNode from './graph-node.js';
export default class AExprNode extends GraphNode {
  
  constructor(aexpr, onClickMap) {
    super(onClickMap);
    this.aexpr = aexpr;
    this.data = this.extractData(aexpr);
  }
    
  onClick(event) {
    this.constructContextMenu(this.aexpr, [this.aexpr.meta().get("location")], event);
  }
  
  getInfo() {
    return this.data;
  }
  
  extractData(ae) {
    const data = [];

    data.push(ae.meta().get("id"));
    data.push(ae.meta().get("sourceCode"));
    const location = ae.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(locationText);
    }
    return data;
  }
}