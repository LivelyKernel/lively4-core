"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeReturnStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeReturnStatement";
  }

  async updateProjection() {
    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }  
}