"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeYieldExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeYieldExpression";
  }

  get delegate() { return this.get('#delegate'); }

  async updateProjection() {
    this.innerHTML = '';
    
    this.delegate.classList.toggle('hidden', !this.node.delegate);

    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}