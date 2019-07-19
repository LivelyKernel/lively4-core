"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeNumericLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeNumericLiteral";
  }
  
  get number() { return this.get('#number'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode
    
    this.number.innerHTML = babelASTNode.value;

    return this;
  }
  
}