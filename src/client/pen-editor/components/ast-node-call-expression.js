"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeCallExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeCallExpression";
  }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    this.createSubtreeForNode(babelASTNode.callee, "callee");
    this.createSubtreeForNodes(babelASTNode.arguments, "arguments");
    
    return this;
  }

}