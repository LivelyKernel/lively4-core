"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeConditionalExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeConditionalExpression";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('test'), 'test');
    await this.createSubElementForPath(this.path.get('alternate'), 'alternate');
    await this.createSubElementForPath(this.path.get('consequent'), 'consequent');
  }
  
}