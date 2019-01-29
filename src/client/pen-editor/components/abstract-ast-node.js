"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class AbstractAstNode extends Morph {
  async initialize() {
    this.windowTitle = "AbstractAstNode";
  }
  
  getAppropriateNode(babelASTNode) {
      return <generic-ast-node></generic-ast-node>;
    if (babelASTNode && babelASTNode.type === 'Identifier') {
      return <ast-node-identifier></ast-node-identifier>;
    } else {
    }
  }
  
  get editor() {
    return lively.allParents(this, [], true).find(ele => ele.localName === 'pen-editor');
  }
}