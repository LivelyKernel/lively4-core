"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeThrowStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeThrowStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}