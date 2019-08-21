"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeAssignmentPattern extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeAssignmentPattern";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('left'), 'left');
    await this.createSubElementForPath(this.path.get('right'), 'right');
  }
  
}