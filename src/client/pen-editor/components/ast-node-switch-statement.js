"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSwitchStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSwitchStatement";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}