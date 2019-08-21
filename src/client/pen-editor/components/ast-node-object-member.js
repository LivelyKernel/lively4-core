"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectMember extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectMember";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}