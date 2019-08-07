"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeSwitchCase extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeSwitchCase";
  }
  
  async updateProjection() {
    this.classList.toggle('default-case', !this.node.test);
    await this.createSubElementForPath(this.path.get('test'), 'test');
    await this.createSubElementForPaths(this.path.get('consequent'), 'consequent');
  }
  
}