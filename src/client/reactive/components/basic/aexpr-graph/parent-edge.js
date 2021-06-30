import Edge from './edge.js'

export default class ParentEdge extends Edge {
  constructor(from, to, graph) {
    super(from, to, graph, {});
    this.impliesParentage = true;
  }
  
}