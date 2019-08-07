"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeArrayExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeArrayExpression";
  }
  
  async updateProjection() {
    await this.createSubElementForPaths(this.path.get('elements'), 'elements');
  }
  
}