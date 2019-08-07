"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectExpression";
  }
  
  async updateProjection() {
    await this.createSubElementForPaths(this.path.get('properties'), 'properties');
  }
  
}