"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeNumericLiteral extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeNumericLiteral";
  }
  
  get number() { return this.get('#number'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode
    
    this.number.innerHTML = babelASTNode.value;

    // const object = await this.getAppropriateNode(babelASTNode.object);
    // await object.setNode(babelASTNode.object);
    // object.slot="object";
    // object.setAttribute('slot',"object");
    // this.appendChild(object)
    // const property = await this.getAppropriateNode(babelASTNode.property);
    // await property.setNode(babelASTNode.property);
    // property.slot="property";
    // property.setAttribute('slot',"property");
    // this.appendChild(property)
    
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