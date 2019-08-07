"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSequenceExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSequenceExpression";
  }
  
  async updateProjection() {
    await this.createSubElementForPaths(this.path.get('expressions'), 'expressions');
  }
  
}