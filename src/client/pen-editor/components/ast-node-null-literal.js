"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeNullLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeNullLiteral";
  }
  
  async updateProjection() {
  }
  
}