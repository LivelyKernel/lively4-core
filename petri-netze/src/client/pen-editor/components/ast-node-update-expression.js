"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeUpdateExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeUpdateExpression";
  }
  
  get prefixOperator() { return this.get('#prefix-operator'); }
  get postfixOperator() { return this.get('#postfix-operator'); }
  
  async updateProjection() {
    this.innerHTML = '';
    
    const { operator, prefix } = this.node;
    this.prefixOperator.innerHTML = operator;
    this.postfixOperator.innerHTML = operator;
    this.prefixOperator.classList.toggle('hidden', !prefix);
    this.postfixOperator.classList.toggle('hidden', prefix);

    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}