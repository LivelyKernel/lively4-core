"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSuper extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSuper";
  }
  
  async updateProjection() {
  }
  
}