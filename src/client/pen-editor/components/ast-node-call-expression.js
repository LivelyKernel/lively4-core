"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeCallExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeCallExpression";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('callee'), 'callee');
    await this.createSubElementForPaths(this.path.get('arguments'), 'arguments');
  }

}