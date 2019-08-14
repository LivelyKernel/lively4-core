"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class CompoundNodeCallFunctionShorthand extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "CompoundNodeCallFunctionShorthand";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('body.callee.property'), 'property');
  }
  
}