

window.livelyEditor = document.querySelector('lively-container').shadowRoot
  .querySelector('lively-editor')

window.html = livelyEditor.currentEditor().getValue()



// we can do it also at runtime
var template = $.parseHTML(html)[0]
var templateClone = document.importNode(template.content, true);
lively.components.templates["lively-inspector"] = templateClone

lively.components.templates["lively-inspector"]

// window.originalTemplate = lively.components.templates["lively-inspector"]



/// window.last = null
lively.inspector.openInspector(null).then(function(comp) {
  if (window.last) last.parentElement.remove()
  window.last = comp
  lively.setPosition(last.parentElement, lively.pt(600,20))
})
