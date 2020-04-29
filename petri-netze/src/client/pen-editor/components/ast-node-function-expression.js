"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeFunctionExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeFunctionExpression";
  }
  
  get generator() { return this.get('#generator'); }
  get async() { return this.get('#async'); }
  
  async updateProjection() {
    this.innerHTML = '';

    // generator: boolean;
    this.generator.classList.toggle('hidden', !this.node.generator);

    // async: boolean;
    this.async.classList.toggle('hidden', !this.node.async);

    await this.createSubElementForPaths(this.path.get('params'), 'params');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}