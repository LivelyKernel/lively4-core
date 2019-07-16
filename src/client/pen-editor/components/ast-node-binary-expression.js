"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeBinaryExpression extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeBinaryExpression";
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;
    
    this.operator.innerHTML = babelASTNode.operator
    
    const left = await this.getAppropriateNode(babelASTNode.left);
    await left.setNode(babelASTNode.left);
    left.slot="left";
    left.setAttribute('slot',"left");
    this.appendChild(left);
    
    const right = await this.getAppropriateNode(babelASTNode.right);
    await right.setNode(babelASTNode.right);
    right.slot="right";
    right.setAttribute('slot',"right");
    this.appendChild(right);

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

  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) {
    this.setNode(other.astNode)
  }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}
  
  
}