"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeAssignmentExpression extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeAssignmentExpression";
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode

    this.operator.innerHTML = babelASTNode.operator;
    
    const left = await this.getAppropriateNode(babelASTNode.left);
    await left.setNode(babelASTNode.left);
    left.slot="left";
    left.setAttribute('slot',"left");
    this.appendChild(left);
    
    const right = await this.getAppropriateNode(babelASTNode.right);
    await right.setNode(babelASTNode.right);
    right.slot="right";
    right.setAttribute('slot',"right");
    this.appendChild(right)
    
    return this;
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