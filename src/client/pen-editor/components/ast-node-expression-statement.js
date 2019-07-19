"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeExpressionStatement extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeExpressionStatement";
  }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    const expression = await this.getAppropriateNode(babelASTNode.expression);
    await expression.setNode(babelASTNode.expression);
    expression.slot="expression";
    expression.setAttribute('slot',"expression");
    this.appendChild(expression);
    
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