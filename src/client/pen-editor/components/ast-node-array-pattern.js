"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeArrayPattern extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeArrayPattern";
  }
  
  async updateProjection() {
    await this.createSubElementForPaths(this.path.get('elements'), 'elements');  }
  
}