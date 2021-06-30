import Edge from './edge.js'

export default class DependencyEdge extends Edge {
  constructor(from, to, graph, dependencyKey, ae) {
    super(from, to, graph, { color: "orangered4", penwidth: 0.99});
    this.dependencyKey = dependencyKey;
    this.ae = ae;
  }
  
  /**MD Abstract Methods */
  
  currentStyle(){
    const {event, ae} = this.graph.getCurrentDependencyChangedEvent();
    if(event) {
      if(ae === this.ae) {
        const style = Object.assign({}, this.options);
        if(event.value.added.some(key => key.equals(this.dependencyKey))) {
          style.color = "green";
          style.penwidth = 3;
        } else if (event.value.removed.some(key => key.equals(this.dependencyKey))) {
          style.color = "red";
          style.penwidth = 3;
        }
        return style;
      }
    }
    return this.options;
  };
  
  isVisible() {
    return Edge.prototype.isVisible.call(this);
  }
}