"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

export default class GenericAstNode extends AbstractAstNode {
  async initialize() {
    this.windowTitle = "GenericAstNode";
    
    this.tabIndex = 0;
  }
  
  get nodeType() { return this.get('#node-type'); }
  get childList() { return this.get('#child-list'); }

  async setNode(babelASTNode) {
    this.innerHTML = '';
    this.astNode = babelASTNode

    this.nodeType.innerHTML = this.astNode.type;
    const fields = babel.types.NODE_FIELDS[this.astNode.type];
    if (!fields) { return; }
    for (let [key, value] of Object.entries(fields)) {
      let childNode;
      let slotName = key;
      
      if (!this.astNode[key] || !this.astNode[key].type) {
        if (Array.isArray(this.astNode[key])) {
          const children = this.astNode[key];
          childNode = await Promise.all(children.map(async child => {
            const node = await this.getAppropriateNode(child);
            await node.setNode(child);
            return node;
          }));
        } else {
          if (this.astNode[key] === true || this.astNode[key] === false) {
            childNode = await (<primitive-boolean></primitive-boolean>);
            childNode.checked = this.astNode[key];
          } else {
            childNode = document.createTextNode(this.astNode[key]);
          }
        }
      } else {
        childNode = await this.getAppropriateNode(this.astNode[key]);
        await childNode.setNode(this.astNode[key]);
      }
      
      const slot = <slot name={slotName}></slot>;
      const kvPair = <span class="kv-pair"><span class="property-key">{key}</span> <div>{slot}</div></span>;
      this.childList.appendChild(kvPair);

      childNode = Array.isArray(childNode) ? childNode : [childNode];
      childNode.forEach(node => {
        node.slot = slotName;
        try {
          node.setAttribute('slot', slotName);
        } catch(e) {}
        
        if (node.constructor === Text) {
          kvPair.appendChild(node);
        } else {
          this.appendChild(node);
        }
      });
    }
    
    return this;
  }
  
  /* Lively-specific API */

  livelyPreMigrate() {} // is called on the old object before the migration
  
  livelyMigrate(other) {
    this.setNode(other.astNode);
  }
  
  livelyInspect(contentNode, inspector) {}
  
  livelyPrepareSave() {}
  
  async livelyExample() {

  }

}
