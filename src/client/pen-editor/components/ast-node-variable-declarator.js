"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeVariableDeclarator extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeVariableDeclarator";
  }
  
  get operator() { return this.get('#operator'); }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('id'), 'id');

    if (this.node.init !== null) {
      this.classList.remove('no-init');
      await this.createSubElementForPath(this.path.get('init'), 'init');
    } else {
      this.classList.add('no-init');
    }
  }

}