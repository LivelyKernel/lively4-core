"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import keyInfo from 'src/client/keyinfo.js';

export default class AstNodeBooleanLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeBooleanLiteral";
  }
  
  async updateProjection() {
    const icon = this.get('#icon');
    icon.classList.toggle('fa-check', this.node.value);
    icon.classList.toggle('fa-times', !this.node.value);
  }
  
  onClick(evt) {
    super.onClick(evt);
  }

  onKeydown(evt) {
    const info = keyInfo(evt);
    
    if (info.space) {
      evt.preventDefault();
      evt.stopPropagation();
      
      this.editor.commandToggleBooleanLiteral(this.node);
      
      return;
    }
    
    return super.onKeydown(evt);
  }
}