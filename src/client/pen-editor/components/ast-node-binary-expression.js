"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeBinaryExpression extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeBinaryExpression";
  }

  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;
    
    this.operator.innerHTML = babelASTNode.operator
    
    await this.createSubtreeForNode(babelASTNode.left, "left");
    await this.createSubtreeForNode(babelASTNode.right, "right");

    return this;
  }

  operatorOptions() {
    <option>==</option>;
    <option>!=</option>;
    <option>===</option>;
    <option>!==</option>;

    <option>&lt;</option>;
    <option>&lt;=</option>;
    <option>&gt;</option>;
    <option>&gt;=</option>;

    <option>&lt;&lt;</option>;
    <option>&gt;&gt;</option>;
    <option>&gt;&gt;&gt;</option>;

    <option>+</option>;
    <option>-</option>;
    <option>*</option>;
    <option>/</option>;
    <option>%</option>;

    <option>|</option>;
    <option>^</option>;
    <option>&amp;</option>;
    <option>in</option>;

    <option>instanceof</option>;
    <option>|></option>;
  }
  
}