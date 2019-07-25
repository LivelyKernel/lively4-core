"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeAssignmentPattern extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeAssignmentPattern";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}