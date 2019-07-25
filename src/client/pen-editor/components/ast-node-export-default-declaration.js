"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeExportDefaultDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeExportDefaultDeclaration";
  }
  
  async updateProjection() {
    this.innerHTML = '';

    await this.createSubElementForPath(this.path.get('declaration'), 'declaration');
  }
  
}