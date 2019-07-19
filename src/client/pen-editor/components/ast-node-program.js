"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeProgram extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeProgram";
  }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    this.createSubtreeForNodes(babelASTNode.body, "body");
    
    return this;
  }

}