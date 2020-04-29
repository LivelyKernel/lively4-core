"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectProperty extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectProperty";
  }
  
  async updateProjection() {
    this.classList.toggle('computed', this.node.computed);
    const shorthand = this.node.shorthand;
    this.classList.toggle('shorthand', shorthand);
    if (shorthand) {
      this.removeSubElementInSlot('key');
    } else {
      await this.createSubElementForPath(this.path.get('key'), 'key');
    }
    
    await this.createSubElementForPath(this.path.get('value'), 'value');
  }
  
}