"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeAssignmentExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = this.constructor.name;
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode

    this.operator.innerHTML = babelASTNode.operator;
    await this.createSubtreeForNode(babelASTNode.left, "left");
    await this.createSubtreeForNode(babelASTNode.right, "right");
    
    return this;
  }

}
// AbstractAstNode.addChildType(AstNodeAssignmentExpression);