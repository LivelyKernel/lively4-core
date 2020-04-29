"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeLogicalExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeLogicalExpression";
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    //   "||" | "&&" | "??"
    this.operator.innerHTML = babelASTNode.operator
    
    await this.createSubElementForPath(this.path.get('left'), 'left');
    await this.createSubElementForPath(this.path.get('right'), 'right');
  }
  
}