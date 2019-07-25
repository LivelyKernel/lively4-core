"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeStringLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeStringLiteral";
  }
  
  get value() { return this.get('#value'); }
  
  async updateProjection() {
    this.innerHTML = '';

    this.value.value = this.node.value;
  }
  
}