"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeNewExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeNewExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPath(this.path.get('callee'), 'callee');
    await this.createSubElementForPaths(this.path.get('arguments'), 'arguments');
  }
  
}