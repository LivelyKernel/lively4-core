"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeVariableDeclaration extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeVariableDeclaration";
  }
  
  get kind() { return this.get('#kind'); }
  
  async updateProjection() {
    this.kind.innerHTML = this.node.kind;
    
    await this.createSubElementForPaths(this.path.get('declarations'), 'declarations');
  }

}