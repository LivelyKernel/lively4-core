"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class $$TEMPLATE_CLASS extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "$$TEMPLATE_CLASS";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    // await this.createSubElementForPath(this.path.get('object'), 'object');
  }
  
}