"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeImportNamespaceSpecifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeImportNamespaceSpecifier";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('local'), 'local');
  }
  
}