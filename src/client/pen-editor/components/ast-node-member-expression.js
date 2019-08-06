"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeMemberExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeMemberExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';
    
    this.classList.toggle('computed', this.node.computed);

    await this.createSubElementForPath(this.path.get('object'), 'object');
    await this.createSubElementForPath(this.path.get('property'), 'property');
  }
  
}