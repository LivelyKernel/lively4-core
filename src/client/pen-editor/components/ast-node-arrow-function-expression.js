"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeArrowFunctionExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeArrowFunctionExpression";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    this.get('#async').classList.toggle('hidden', !this.node.async);
    
    await this.createSubElementForPaths(this.path.get('params'), 'params');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}