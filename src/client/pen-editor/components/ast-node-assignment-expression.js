"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeAssignmentExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = this.constructor.name;
  }
  
  get operator() { return this.get('#operator'); }
  
  async updateProjection() {
    this.innerHTML = '';

    this.operator.innerHTML = this.node.operator;
    await this.createSubElementForPath(this.path.get('left'), 'left');
    await this.createSubElementForPath(this.path.get('right'), 'right');
  }

}