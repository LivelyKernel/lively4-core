"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeImportSpecifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeImportSpecifier";
  }
  
  async updateProjection() {
    this.classList.toggle('basic', this.path.node.local.name === this.path.node.imported.name)

    await this.createSubElementForPath(this.path.get('local'), 'local');
    await this.createSubElementForPath(this.path.get('imported'), 'imported');
  }
  
}