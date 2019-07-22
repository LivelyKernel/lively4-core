"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeReturnStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeReturnStatement";
  }

  async updateProjection() {
    this.innerHTML = '';
    
    await this.createSubElementForPath(this.path.get('argument'), 'argument');
  }  
}