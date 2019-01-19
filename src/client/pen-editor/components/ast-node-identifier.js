"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeIdentifier extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeIdentifier";
  }
  get name() { return this.get('#name'); }
  
  async setNode(babelASTNode) {
    this.name.value = babelASTNode.name;
  }
}