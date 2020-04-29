"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class CompoundNodeAccessFunctionShorthand extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "CompoundNodeAccessFunctionShorthand";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('body').get('property'), 'property');
  }
  
}