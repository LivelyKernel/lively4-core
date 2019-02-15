# Web-Components


Lively4 was developed using the first generation of Web components (v0), which is now deprecated... 
So, we have to migrate, but that is not straight forward since v0 and v1 are really different approaches.

- v1 -> v0 shim? <https://unpkg.com/ce-v0@0.2.2/index.js>



So lets look at the new approach:

from <https://developers.google.com/web/fundamentals/web-components/customelements>

```javascript

window.ExampleComponent = class ExampleComponent extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'foo'];
  }

  constructor() {
    super(); // always call super() first in the constructor.
    console.log("ExampleComponent>>constructor")
  }
  connectedCallback() {
    console.log("ExampleComponent>>connectedCallback")

  }
  disconnectedCallback() {
    console.log("ExampleComponent>>disconnectedCallback")
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    console.log("ExampleComponent>>attributeChangedCallback")
  }
  adoptedCallback()	{
    console.log("ExampleComponent>>adoptedCallback")
  }
}
ExampleComponent.prototype.connectedCallback = function() {
  console.log("ExampleComponent>>connectedCallback XXX2");
}

window.customElements.define('example4-component', ExampleComponent);


```

<div style="background-color: gray; width: 100px; height: 100px">
  <example4-component></example4-component>
</div>




```javascript

window.ExampleComponent = class ExampleComponent extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'foo'];
  }

  constructor() {
    super(); // always call super() first in the constructor.
    console.log("ExampleComponent>>constructor")
  }
  connectedCallback() {
    console.log("ExampleComponent>>connectedCallback")

  }
  disconnectedCallback() {
    console.log("ExampleComponent>>disconnectedCallback")
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    console.log("ExampleComponent>>attributeChangedCallback")
  }
  adoptedCallback()	{
    console.log("ExampleComponent>>adoptedCallback")
  }
}
ExampleComponent.prototype.connectedCallback = function() {
  console.log("ExampleComponent>>connectedCallback XXX3");
}



window.ExampleComponentProxy = class ExampleComponentProxy extends ExampleComponent {
  
  constructor() {
    super(); // always call super() first in the constructor.
  }
  
  connectedCallback( args) {
    // return super.connectedCallback(...args)
    // super seams to bind early?
    return this.constructor.__proto__.prototype.connectedCallback.apply(this, args)
  }
  disconnectedCallback(...args) {
    // return super.disconnectedCallback(...args)
    return this.constructor.__proto__.prototype.disconnectedCallback.apply(this, args)
  }
  
  adoptedCallback(...args)	{
    // return super.adoptedCallback(...args)
    return this.constructor.__proto__.prototype.adoptedCallback.apply(this, args)
  }
}

window.customElements.define('example11-component', ExampleComponentProxy);


```

<div style="background-color: blue; width: 100px; height: 100px">
  <example11-component></example11-component>
</div>


## Changing the prototype


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
    console.log("ExampleComponent2>>connectedCallback")

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

ExampleComponentProxy.__proto__ = window.ExampleComponent2
ExampleComponentProxy.prototype.__proto__ = window.ExampleComponent2.prototype

```

OK, this seems to work. We have now a way to update classes at runtime.


