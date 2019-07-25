"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeImportDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeImportDeclaration";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPaths(this.path.get('specifiers'), 'specifiers');
    await this.createSubElementForPath(this.path.get('source'), 'source');
  }
  
}