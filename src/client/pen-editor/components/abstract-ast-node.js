"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class AbstractAstNode extends Morph {
  async initialize() {
    this.windowTitle = "AbstractAstNode";
  }
  
  getAppropriateNode(babelASTNode) {
    if (babelASTNode && babelASTNode.type === 'Identifier') {
      return <ast-node-identifier></ast-node-identifier>;
    } else if (babelASTNode && babelASTNode.type === 'MemberExpression') {
      return <ast-node-member-expression></ast-node-member-expression>;
    }
    return <generic-ast-node></generic-ast-node>;
  }
  
  get editor() {
    return lively.allParents(this, [], true).find(ele => ele.localName === 'pen-editor');
  }
}