import * as scriptManager from  "../script-manager.js";

export function register(componentName, template, prototype) {
  var proto = prototype || Object.create(HTMLElement.prototype);

  proto.createdCallback = function() {
    var root = this.createShadowRoot();
    // clone the template again, so when more elements are created,
    // they get their own elements from the template
    var clone = document.importNode(template, true)
    root.appendChild(clone);

    var component = this;

    $(root).children("script[type=lively4script]").each(function(idx) {
      scriptManager.addScript(component, new Function(this.innerHTML), {name: this.getAttribute('data-name')});
    });

    // call the initialize script
    try {
      scriptManager.callScript(component, "initialize");
    } catch (e) {
      console.log("There is no initialize script to be called");
    }
  }

  document.registerElement(componentName, {
    prototype: proto
  });
}