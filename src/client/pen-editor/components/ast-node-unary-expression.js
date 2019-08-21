"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeUnaryExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeUnaryExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';
    
    if (!this.node.prefix) {
      lively.error('non-prefix unary expression!')
    }
    
    this.get('#operator').innerHTML = this.node.operator;

    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}