"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import keyInfo from 'src/client/keyinfo.js';

function cancelEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

export default class AstNodeNumericLiteral extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "AstNodeNumericLiteral";
    
    this.useInner = false;
    this.valueToReturnTo;
    
    this.number.on('keydown', evt => this.innerKeydown(evt));
    this.number.on('focusout', evt => this.innerFocusout(evt));
    this.number.on('click', evt => this.innerClick(evt));
  }
  
  get number() { return this.get('#number'); }
  
  get useInner() { return this.classList.contains('use-inner'); }
  set useInner(v) {
    this.classList.toggle('use-inner', !!v);
    return this.useInner;
  }

  get val() { return Number(this.number.value.value); }
  set val(v) { return this.number.value.value = v; }

  async updateProjection() {
    this.val = this.node.value;
  }
  
  innerClick(evt) {
    if (!this.useInner) {
      this.focus();
    }
  }
  innerFocusout(evt) {
    this.out;
  }
  innerKeydown(evt) {
    const {char, space, enter, escape} = keyInfo(evt);
    
    if (this.useInner) {
      evt.stopPropagation();
      
      if (escape) {
        evt.preventDefault();
        this.val = this.valueToReturnTo;
        this.focus();
        this.out();
      }
      
      if (enter) {
        evt.preventDefault();
        this.editor.commandModifyNumericLiteral(this.node, this.val);
        this.out();
      }
    }
  }
  
  out() {
    this.useInner = false;
  }
  into() {
    this.useInner = true;
    this.valueToReturnTo = this.val;
    this.number.focus();
  }
  
  onKeydown(evt) {
    const info = keyInfo(evt);
    
    if (info.space) {
      evt.preventDefault();
      evt.stopPropagation();
      
      this.into();
      
      return;
    }
    
    return super.onKeydown(evt);
  }
}