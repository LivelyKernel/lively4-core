export function register(componentName, template) {
  var component = document.registerElement(componentName, {
    prototype: Object.create(HTMLElement.prototype, {
      createdCallback: {
        value: function() {
          var root = this.createShadowRoot();
          // var template = document.currentScript.ownerDocument.querySelector("#" + componentName);
          // var clone = document.importNode(template.content, true);
          root.appendChild(template);
        }
      }
    })
  });
}