"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeRegExpLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeRegExpLiteral";
  }
  
  async updateProjection() {
    this.get('#pattern').innerHTML = this.node.pattern;
    this.get('#flags').innerHTML = this.node.flags;
  }
  
}