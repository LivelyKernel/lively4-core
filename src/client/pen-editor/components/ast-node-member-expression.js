"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeMemberExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeMemberExpression";
  }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode

    await this.createSubtreeForNode(babelASTNode.object, "object");
    await this.createSubtreeForNode(babelASTNode.property, "property");
    
    return this;
  }
  
}