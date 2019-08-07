"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeExportSpecifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeExportSpecifier";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('local'), 'local');
    const aliased = this.node.local.name !== this.node.exported.name;
    this.classList.toggle('aliased', aliased);
    if (aliased) {
      await this.createSubElementForPath(this.path.get('exported'), 'exported');
    } else {
      const exported = this.get(':scope > [slot=exported]');
      if (exported) {
        exported.remove();
      }
    }
  }
  
}