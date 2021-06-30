import CombinedNode from './combined-node.js';

export default class DatabindingNode extends CombinedNode {
  
  constructor(graph, AENode, IndentifierNode) {
    super(graph, [AENode, IndentifierNode]);
  }
}