export function register(componentName, template) {
  var proto = Object.create(HTMLElement.prototype);

  proto.createdCallback = function() {
    var root = this.createShadowRoot();
    // clone the template again, so when more elements are created,
    // they get their own elements from the template
    var clone = document.importNode(template, true)
    root.appendChild(clone);

    var component = this;
    // run the initialize script
    // TO BE MOVED
    $(root).children("script[type=lively4-script][name=initialize]").each(function(idx) {
      var fun = new Function(this.innerHTML);
      // run script in context of newly created element
      fun.call(component);
    });
  }

  document.registerElement(componentName, {
    prototype: proto
  });
}