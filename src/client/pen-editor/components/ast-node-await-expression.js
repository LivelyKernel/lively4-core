"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeAwaitExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeAwaitExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}