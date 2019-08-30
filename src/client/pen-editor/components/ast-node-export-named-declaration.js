"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeExportNamedDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeExportNamedDeclaration";
  }
  
  async updateProjection() {
    this.classList.toggle('the-class', Math.random() > 0.5)
    
    await this.createSubElementForPath(this.path.get('declaration'), 'declaration');
    await this.createSubElementForPaths(this.path.get('specifiers'), 'specifiers');
    this.classList.toggle('no-source', !this.node.source);
    await this.createSubElementForPath(this.path.get('source'), 'source');
  }
  
}