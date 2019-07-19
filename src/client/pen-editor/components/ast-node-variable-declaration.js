"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeVariableDeclaration extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeVariableDeclaration";
  }
  
  get kind() { return this.get('#kind'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;

    this.kind.innerHTML = babelASTNode.kind;
    
    const childElements = await Promise.all(babelASTNode.declarations.map(async childStep => {
      const childElement = await this.getAppropriateNode(childStep);
      await childElement.setNode(childStep);
      childElement.slot="declarations";
      childElement.setAttribute('slot',"declarations");
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