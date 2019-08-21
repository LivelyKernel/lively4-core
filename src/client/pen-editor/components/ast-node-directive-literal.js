"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeDirectiveLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeDirectiveLiteral";
  }
  
  async updateProjection() {
    this.get('#value').innerHTML = this.node.value;
  }
  
}