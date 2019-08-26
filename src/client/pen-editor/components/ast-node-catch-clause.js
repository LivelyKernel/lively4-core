"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeCatchClause extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeCatchClause";
  }
  
  async updateProjection() {
    if (this.node.param) {
      await this.createSubElementForPath(this.path.get('param'), 'param');
    } else {
      this.removeSubElementInSlot('param');
    }

    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}