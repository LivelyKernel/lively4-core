"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeWithStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeWithStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('object'), 'object');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}