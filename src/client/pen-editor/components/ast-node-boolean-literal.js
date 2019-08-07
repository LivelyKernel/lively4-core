"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeBooleanLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeBooleanLiteral";
  }
  
  async updateProjection() {
    const icon = this.get('#icon');
    icon.classList.toggle('fa-check', this.node.value);
    icon.classList.toggle('fa-times', !this.node.value);
  }
  
}