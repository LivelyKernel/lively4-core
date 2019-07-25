"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeThrowStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeThrowStatement";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}