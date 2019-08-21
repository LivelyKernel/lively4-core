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
      const local = this.get(':scope > [slot=local]');
      if (local) {
        local.remove();
      }
    }
    await this.createSubElementForPath(this.path.get('imported'), 'imported');
  }
  
}