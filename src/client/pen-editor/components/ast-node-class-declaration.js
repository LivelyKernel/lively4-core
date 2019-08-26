"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeClassDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeClassDeclaration";
  }
  
  get id() { return this.get('#id'); }
  
  async updateProjection() {
    if (this.node.id || this.path.parentPath.type !== 'ExportDefaultDeclaration') {
      await this.createSubElementForPath(this.path.get('id'), 'id');
    } else {
      this.removeSubElementInSlot('id');
    }
    
    const hasSuperClass = this.node.superClass;
    this.get('#extends').classList.toggle('hidden', !hasSuperClass);
    if (hasSuperClass) {
      await this.createSubElementForPath(this.path.get('superClass'), 'superClass');
    } else {
      this.removeSubElementInSlot('superClass');
    }

    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}