export default class Edge {
  
  // See https://graphviz.org/doc/info/attrs.html for possible options
  constructor(from, to, graph, options = {}, toPort) {
    this.from = from;
    this.to = to;
    this.toPort = toPort;
    this.graph = graph;
    this.options = options;
    this.impliesParentage = false;
  }
  
  /**MD Abstract Methods */
  
  currentStyle(){return this.options};
  
  multiplicity(){return 1};
  
  isVisible(){
    return this.multiplicity() > 0 && this.getStart().visible && this.getDestination().visible;
  };
  
  /** Interface */
  getDOT() {
    if(!this.isVisible()) return [];
    const start = this.getStart();
    const destination = this.getDestination();
    if(start === destination) return [];
    return start.id + "->" + destination.id + this.toPortString(destination) + " [" + this.getOptionString() + "]";
  }
  
  /** Helpers */
  getOptionString() {
    let count = this.multiplicity();
    const style = Object.assign({}, this.currentStyle());
    if(count > 1) {
      style.taillabel = count;
    }
    return Object.keys(style).map(option => option + " = " + style[option]).join(", ");    
  }
  
  toPortString(destination) {
    if(destination !== this.to) return "";
    return this.toPort ? (":" + this.toPort + ":_") : "";
  }
  
  // this.from or the node it is collapsed by.
  getStart() {
    return this.from.collapsedBy || this.from;
  }
  
  // this.to or the node it is collapsed by.
  getDestination() {
    return this.to.collapsedBy || this.to;    
  }
  
  isParentEdge() {
    return this.impliesParentage;
  }
}