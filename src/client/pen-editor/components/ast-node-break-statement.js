"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeBreakStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeBreakStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('label'), 'label');
  }
  
}