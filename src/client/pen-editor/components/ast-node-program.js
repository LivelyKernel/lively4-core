"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeProgram extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeProgram";
  }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    const childElements = await Promise.all(babelASTNode.body.map(async childStep => {
      const childElement = await this.getAppropriateNode(childStep);
      await childElement.setNode(childStep);
      childElement.slot="body";
      childElement.setAttribute('slot',"body");
      return childElement;
    }));
    childElements.forEach(childElement => {
      this.appendChild(childElement)
    });
    
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