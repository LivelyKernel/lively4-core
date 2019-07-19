"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeVariableDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeVariableDeclaration";
    
    this.classList.add('border-wrap')
  }
  
  get kind() { return this.get('#kind'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    this.kind.innerHTML = babelASTNode.kind;
    
    this.createSubtreeForNodes(babelASTNode.declarations, "declarations");

    return this;
  }

}