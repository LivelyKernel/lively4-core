"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeObjectMethod extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeObjectMethod";
  }
  
  get generator() { return this.get('#generator'); }
  get async() { return this.get('#async'); }
    get kind() { return this.get('#kind'); }
  
  async updateProjection() {
    // kind: "method" | "get" | "set";
    const kind = this.node.kind;
    const isAccessor = kind === 'get' || kind === 'set';
    this.kind.classList.toggle('hidden', !isAccessor);
    if (isAccessor) {
      this.kind.innerHTML = kind;
    }
    
    // async: boolean;
    this.async.classList.toggle('hidden', !this.node.async);

    // generator: boolean;
    this.generator.classList.toggle('hidden', !this.node.generator);

    this.classList.toggle('computed', this.node.computed);
    await this.createSubElementForPath(this.path.get('key'), 'key');
    
    await this.createSubElementForPaths(this.path.get('params'), 'params');

    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}