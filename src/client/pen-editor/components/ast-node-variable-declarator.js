"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class AstNodeVariableDeclarator extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "AstNodeVariableDeclarator";
  }
  
  get operator() { return this.get('#operator'); }
  
  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode;
    
    const id = await this.getAppropriateNode(babelASTNode.id);
    await id.setNode(babelASTNode.id);
    id.slot="id";
    id.setAttribute('slot',"id");
    this.appendChild(id);
    
    if (babelASTNode.init !== null) {
      this.classList.remove('no-init');
      const init = await this.getAppropriateNode(babelASTNode.init);
      await init.setNode(babelASTNode.init);
      init.slot="init";
      init.setAttribute('slot',"init");
      this.appendChild(init);
    } else {
      this.classList.add('no-init');
    }

    return this;
  }

  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) {
    this.setNode(other.astNode)
  }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}
  
  
}