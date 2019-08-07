"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectProperty extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectProperty";
  }
  
  async updateProjection() {
    this.classList.toggle('computed', this.node.computed);
    await this.createSubElementForPath(this.path.get('key'), 'key');
    
    this.classList.toggle('shorthand', this.node.shorthand);
    await this.createSubElementForPath(this.path.get('value'), 'value');
  }
  
}