"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeForOfStatement extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeForOfStatement";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('left'), 'left');
    await this.createSubElementForPath(this.path.get('right'), 'right');
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}