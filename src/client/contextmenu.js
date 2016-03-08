import lively from "./lively.js";

var contextmenu = {
  menu: null, // since, we don't have local multi-user interaction in the browser anyway, we can keep it simple...
  hide: function() {
    if (this.menu) $(this.menu).remove()
  },
  openComponentInWindow: function (name, evt) {
    var comp  = document.createElement(name)
    this.hide()
    return lively.components.openInWindow(comp).then((w) => {
        lively.setPosition(w, lively.pt(evt.clientX, evt.clientY))
        return comp
    })
  },
  // idea: expose items as structure rather then as computation, should led itself to customization
  // without having to use dynamic behavioral adaptations such as COP.
  items: [
    ["Workspace", (evt) => {
      contextmenu.hide()
      lively.openWorkspace("", lively.pt(evt.clientX, evt.clientY))
    }],
    ["Browser",     (evt) => {
      contextmenu.openComponentInWindow("lively-container", evt).then(comp => {
        comp.followPath(lively4url +"/")
    })
    }],
    ["File Editor",     (evt) => contextmenu.openComponentInWindow("lively-editor", evt)],
    ["File Browser",    (evt) => contextmenu.openComponentInWindow("lively-file-browser", evt)],
    ["Filesystems",     (evt) => contextmenu.openComponentInWindow("lively-filesystems", evt)],
    ["Terminal",        (evt) => contextmenu.openComponentInWindow("lively-terminal", evt)],
    ["Console",         (evt) => contextmenu.openComponentInWindow("lively-console", evt)],
     ["Math Workspace",         (evt) => contextmenu.openComponentInWindow("lively-math", evt)],
    ["Component Bin",   (evt) => contextmenu.openComponentInWindow("lively-component-bin", evt)],
    ["Persistens Settings", (evt) => {
        contextmenu.openComponentInWindow("lively-persistence-settings", evt).then((comp) => {
            comp.parentElement.style.height = "150px"
            comp.parentElement.style.width = "400px"
        })
    }],
    ["Text", function(evt) {
            var text  = document.createElement("p")
            text.innerHTML = "Hello"
            $('body')[0].appendChild(text)
            lively.setPosition(text, lively.pt(evt.clientX, evt.clientY))
            if (menu) $(menu).remove()
    }],
    ["Rectangle", function(evt) {
        var morph  = document.createElement("div")
        morph.style.width = "200px"
        morph.style.height = "100px"
        lively.setPosition(morph, lively.pt(evt.clientX, evt.clientY))
        morph.style.backgroundColor = "blue"
        $('body')[0].appendChild(morph)
        contextmenu.hide()
    }]
  ],
  openIn: function(container, evt) {
    this.hide()
    var menu = lively.components.createComponent("lively-menu")
    return lively.components.openIn(container, menu).then(() => {
      this.menu = menu
      menu.openOn(contextmenu.items).then(() => {
            if (evt) lively.setPosition(menu, lively.pt(evt.clientX, evt.clientY))
      })
      return menu
    })
  }
}

export default contextmenu

console.log("loaded contextmenu")
