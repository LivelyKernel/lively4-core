# Draft Example Component

### 1. Get the proxy in place....

<div style="border: 1px solid blue; width: 100px; height: 100px">
  <draft-example-component9 style="display: block; border: 2px solid red; width: 50px; height: 50px"></draft-example-component9>
</div>


```javascript
// this code has to be right... and general, because it cannot be changed later at runtime. 
window.DraftExampleComponentProxy = class DraftExampleComponentProxy extends HTMLElement {
  constructor() {
    super(); // always call super() first in the constructor.
    // this.initialize && this.initialize()
  }
  
  connectedCallback(...args)  {
    return super.connectedCallback && super.connectedCallback(...args);
    // var method = this.constructor.__proto__.prototype.connectedCallback
    // return method && method.apply(this, args)
  }
  
  disconnectedCallback(...args) {
    return super.disconnectedCallback && super.disconnectedCallback(...args);
    // var method = this.constructor.__proto__.prototype.disconnectedCallback
    // return method && method.apply(this, args)
  }
  
  // has only effect before custom element definition :(
  // #TODO: fake API with a MutationObserver
  // attributeChangedCallback(attrName, oldVal, newVal) {
  //   return super.attributeChangedCallback && super.attributeChangedCallback(...args);
  // }
  // static get observedAttributes() {
  //   return super.observedAttributes;
  // }

  adoptedCallback(...args)	{
    return super.adoptedCallback && super.adoptedCallback(...args);
    // var method = this.constructor.__proto__.prototype.adoptedCallback
    // return method && method.apply(this, args)
  }
}

// this has an effect on components that are already loaded and the ones that will be loaded. 
window.customElements.define('draft-example-component9', DraftExampleComponentProxy);
```

### 2. Load the real thing

We don't actually have to wait for after the proxy is there, but we can. But if we wait... the creation events are gone. 


```javascript
window.ExampleComponent2 = class ExampleComponent2 extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'foo'];
  }

  constructor() {
    super(); // always call super() first in the constructor.
    console.log("ExampleComponent2>>constructor")
  }
  connectedCallback() {
    console.log("ExampleComponent43>>connectedCallback")

  }
  disconnectedCallback() {
    console.log("ExampleComponent2>>disconnectedCallback")
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    console.log("ExampleComponent2>>attributeChangedCallback")
  }
  adoptedCallback()	{
    console.log("ExampleComponent2>>adoptedCallback")
  }
}

DraftExampleComponentProxy.__proto__ = window.ExampleComponent2
DraftExampleComponentProxy.prototype.__proto__ = window.ExampleComponent2.prototype
```



```javascript

import DraftExampleComponent from "doc/web-components/draft-example-component.js"




DraftExampleComponentProxy.__proto__ = DraftExampleComponent
DraftExampleComponentProxy.prototype.__proto__ = DraftExampleComponent.prototype


// HTMLElement.isPrototypeOf(DraftExampleComponent)

```


