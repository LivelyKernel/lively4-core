"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

export default class AstNodeClassMethod extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeClassMethod";
  }
  
  get generator() { return this.get('#generator'); }
  get static() { return this.get('#static'); }
  get async() { return this.get('#async'); }
  get kind() { return this.get('#kind'); }
  
  async updateProjection() {
    this.innerHTML = '';

    // generator: boolean;
    this.generator.classList.toggle('hidden', !this.node.generator);

    // static: boolean;
    this.static.classList.toggle('hidden', !this.node.static);

    // async: boolean;
    this.async.classList.toggle('hidden', !this.node.async);

    // computed: boolean;
    this.getAllSubmorphs('.computed-brackets').forEach(bracket => {
      bracket.classList.toggle('hidden', !this.node.computed);
    });

    // kind: "constructor" | "method" | "get" | "set";
    const kind = this.node.kind;
    const isAccessor = kind === 'get' || kind === 'set';
    this.kind.classList.toggle('hidden', !isAccessor);
    if (isAccessor) {
      this.kind.innerHTML = kind;
    }

    // key: Expression;
    await this.createSubElementForPath(this.path.get('key'), 'key');

    // params: [ Pattern ];
    await this.createSubElementForPaths(this.path.get('params'), 'params');

    // body: BlockStatement;
    await this.createSubElementForPath(this.path.get('body'), 'body');
  }
  
}