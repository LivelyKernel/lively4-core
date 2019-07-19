"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeVariableDeclarator extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeVariableDeclarator";
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;
    
    await this.createSubtreeForNode(babelASTNode.id, "id");
    
    if (babelASTNode.init !== null) {
      this.classList.remove('no-init');
      await this.createSubtreeForNode(babelASTNode.init, "init");
    } else {
      this.classList.add('no-init');
    }

    return this;
  }

}