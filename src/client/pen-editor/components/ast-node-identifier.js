"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import keyInfo from 'src/client/keyinfo.js';
import { isVariable } from 'src/client/reactive/babel-plugin-active-expression-rewriting/utils.js';
import d3 from 'src/external/d3.v5.js';

export default class AstNodeIdentifier extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeIdentifier";
  }

  furtherStyles() { return `
::part(input-field) {
  ${isVariable(this.path) ?
    
    'text-decoration: underline; font-weight: bold; color: ' + d3.hsl(
      Math.random() * 360,
      Math.random() * 0.2 + 0.4,
      Math.random() * 0.2 + 0.4
    )
    : ''}
}
`; }
  
  get name() { return this.get('#name'); }

  async updateProjection() {
    this.name.value = this.node.name;
  }

  onFocus(evt) {
    super.onFocus(evt);
    this.name.focus();
  }

  onKeydown(evt) {
    const info = keyInfo(evt);
    
    if (info.ctrl && info.char === "R") {
      evt.preventDefault();
      evt.stopPropagation();
      
      const newName = window.prompt('new identifier name');
      
      if (newName) {
        this.editor.changeIdentifier(this.node, newName);
      }
      
      return;
    }
    
    return super.onKeydown(evt);
  }
  
}