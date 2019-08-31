"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class CompoundNodeSubmorphGetter extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "CompoundNodeSubmorphGetter";
  }
  
  async updateProjection() {
    await this.createSubElementForPath(this.path.get('key'), 'key');
    await this.createSubElementForPath(this.path.get('body.body.0.argument.arguments.0'), 'selector');
  }
  
}