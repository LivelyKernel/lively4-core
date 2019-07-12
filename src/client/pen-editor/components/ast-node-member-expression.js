"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeMemberExpression extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeMemberExpression";
  }
  
  async setNode(babelASTNode) {
    const object = await this.getAppropriateNode(babelASTNode.object);
    await object.setNode(babelASTNode.object);
    object.slot="object";
    object.setAttribute('slot',"object");
    this.appendChild(object)
    const property = await this.getAppropriateNode(babelASTNode.property);
    await property.setNode(babelASTNode.property);
    property.slot="property";
    property.setAttribute('slot',"property");
    this.appendChild(property)
    
    return this;
  }
  
  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) {}
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}
  
  
}