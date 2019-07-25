"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSpreadElement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSpreadElement";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}