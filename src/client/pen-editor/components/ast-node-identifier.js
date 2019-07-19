"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeIdentifier extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeIdentifier";
  }
  get name() { return this.get('#name'); }
  
  async setNode(babelASTNode) {
    this.astNode = babelASTNode

    this.name.value = babelASTNode.name;
    
    return this;
  }

  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) {
    this.setNode(other.astNode)
  }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}
  
  
}