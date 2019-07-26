"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeLabeledStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeLabeledStatement";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPath(this.path.get('label'), 'label');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}