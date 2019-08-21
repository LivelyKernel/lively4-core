"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeRestElement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeRestElement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }
  
}