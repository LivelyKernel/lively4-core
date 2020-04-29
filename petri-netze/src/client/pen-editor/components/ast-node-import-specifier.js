"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeImportSpecifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeImportSpecifier";
  }
  
  async updateProjection() {
    const aliased = this.path.node.local.name !== this.path.node.imported.name;
    this.classList.toggle('basic', !aliased);
    if (aliased) {
      await this.createSubElementForPath(this.path.get('local'), 'local');
    } {
      this.removeSubElementInSlot('local')
    }

    await this.createSubElementForPath(this.path.get('imported'), 'imported');
  }
  
}