"enable aexpr";

import AbstractAstNode from './abstract-ast-node.js'

const babel7 = window.lively4babel.babel

export default class GenericAstNode extends AbstractAstNode {
  async initialize() {
    await super.initialize();
    this.windowTitle = "GenericAstNode";
    
    this.tabIndex = 0;
  }
  
  get nodeType() { return this.get('#node-type'); }
  get childList() { return this.get('#child-list'); }

  async updateProjection() {
    this.innerHTML = '';

    const type = this.path.type;
    this.nodeType.innerHTML = type;

    const fields = babel7.types.NODE_FIELDS[type];
    if (!fields) { return; }
    for (let [key, value] of Object.entries(fields)) {
      let childElement;
      const slotName = key;
      
      if (!this.astNode[key] || !this.astNode[key].type) {
        if (Array.isArray(this.astNode[key])) {
          const childPaths = this.path.get(key);
          childElement = await Promise.all(childPaths.map(async childPath => {
            const [element] = await this.getAppropriateElement(childPath);
            await element.setPath(childPath);
            return element;
          }));
        } else {
          if (this.astNode[key] === true || this.astNode[key] === false) {
            childElement = await (<primitive-boolean></primitive-boolean>);
            childElement.checked = this.astNode[key];
          } else {
            childElement = document.createTextNode(this.astNode[key]);
          }
        }
      } else {
        let childPath = this.path.get(key);
        [childElement] = await this.getAppropriateElement(childPath);
        await childElement.setPath(childPath);
      }
      
      const slot = <slot name={slotName}></slot>;
      const kvPair = <span class="kv-pair"><span class="property-key">{key}</span> <div>{slot}</div></span>;
      this.childList.appendChild(kvPair);

      childElement = Array.isArray(childElement) ? childElement : [childElement];
      childElement.forEach(node => {
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
  
}
