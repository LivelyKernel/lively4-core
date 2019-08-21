"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeWhileStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeWhileStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('test'), 'test');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}