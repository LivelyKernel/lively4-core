"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeIfStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeIfStatement";
  }
  
  async updateProjection() {
    this.innerHTML = '';
    await this.createSubElementForPath(this.path.get('test'), 'test');
    await this.createSubElementForPath(this.path.get('consequent'), 'consequent');
    this.classList.toggle('has-alternate', this.node.alternate);
    await this.createSubElementForPath(this.path.get('alternate'), 'alternate');
  }
  
}