import * as scriptManager from  "../script-manager.js";

export function register(componentName, template, prototype) {
  var proto = prototype || Object.create(HTMLElement.prototype);

  proto.createdCallback = function() {
    var root = this.createShadowRoot();
    // clone the template again, so when more elements are created,
    // they get their own elements from the template
    var clone = document.importNode(template, true)
    root.appendChild(clone);

    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(this);
    // call the initialize script, if it exists
    if (typeof this.initialize === "function") {
      this.initialize();
    }
  }

  document.registerElement(componentName, {
    prototype: proto
  });
}