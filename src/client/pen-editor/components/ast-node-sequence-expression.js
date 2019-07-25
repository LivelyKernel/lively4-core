"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSequenceExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSequenceExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}