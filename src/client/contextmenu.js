import * as lively from  "./lively.js";


export function openIn(container, evt, cb) {

    var menu

    function openComponentInWindow(name) {
        var comp  = document.createElement(name)
        if (menu) $(menu).remove()
        return lively.components.openInWindow(comp).then((container) => {
            lively.setPosition(container, lively.pt(evt.clientX, evt.clientY))
        })
    }


    var MyApp = {
        getMenuItems: function(){
            return [
                ["Workspace",       () => openComponentInWindow("juicy-ace-editor")],
                ["File Editor",     () => openComponentInWindow("lively-editor")],
                ["File Browser",    () => openComponentInWindow("lively-file-browser")],
                ["Filesystems",     () => openComponentInWindow("lively-filesystems")],
                ["Terminal",        () => openComponentInWindow("lively-terminal")],
                ["Console",         () => openComponentInWindow("lively-console")],
                ["Component Bin",   () => openComponentInWindow("lively-component-bin")],
                ["Persistens Settings", () => {
                    openComponentInWindow("lively-persistence-settings").then((container) => {
                        container.style.height = "150px"
                        container.style.width = "400px"
                    })
                }],
                ["Text", function() {
                        var text  = document.createElement("p")
                        text.innerHTML = "Hello"
                        $('body')[0].appendChild(text)
                         lively.setPosition(text, lively.pt(evt.clientX, evt.clientY))
                        if (menu) $(menu).remove()
                }],
                ["Rectangle", function() {
                    var morph  = document.createElement("div")
                    morph.style.width = "200px"
                    morph.style.height = "100px"
                    lively.setPosition(morph, lively.pt(evt.clientX, evt.clientY))
                    morph.style.backgroundColor = "blue"
                    $('body')[0].appendChild(morph)
                    if (menu) $(menu).remove()
                }]
            ]
        }
    }

    lively.components.loadByName("lively-menu")

    menu = document.createElement("lively-menu")
    var openMenuCB = function() {
        console.log("menu initialized")
        menu.openOn(MyApp, (menu) => {
            if (evt)  lively.setPosition(menu, lively.pt(evt.clientX, evt.clientY))
            cb(menu)
        })
    }
    if (menu.openOn) {
        console.log("initialze directly")
        openMenuCB()
    } else {
        console.log("register initialized callback")
        menu.addEventListener("initialized", openMenuCB)
    }
    container.appendChild(menu)
    lively.components.loadUnresolved()
    return menu
}

console.log("loaded context-menu")