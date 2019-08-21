"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectPattern extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectPattern";
  }
  
  async updateProjection() {
    await this.createSubElementForPaths(this.path.get('properties'), 'properties');
  }
  
}