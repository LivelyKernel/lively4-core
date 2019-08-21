"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeThisExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeThisExpression";
  }
  
  async updateProjection() {
  }
  
}