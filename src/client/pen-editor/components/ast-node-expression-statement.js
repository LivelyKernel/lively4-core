"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeExpressionStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeExpressionStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('expression'), 'expression');
  }
  
}