"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeDirective extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeDirective";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('value'), 'value');
  }
  
}