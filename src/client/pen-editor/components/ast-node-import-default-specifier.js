"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeImportDefaultSpecifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeImportDefaultSpecifier";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('local'), 'local');
  }
  
}