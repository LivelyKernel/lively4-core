"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeIdentifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeIdentifier";
  }

  get name() { return this.get('#name'); }

  async updateProjection() {
    this.name.value = this.node.name;
  }

}