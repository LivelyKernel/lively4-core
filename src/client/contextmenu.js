import * as lively from  "./lively.js";

function openComponentInWindow(name) {
    var comp  = document.createElement(name)
    return lively.components.openInWindow(comp)
}
 
export function openIn(container) {
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
                    var comp = openComponentInWindow("lively-persistence-settings")
                    comp.style.height = "150px"
                    comp.style.width = "400px"
                }],
                ["Text", function() {
                        var text  = document.createElement("p")
                        text.innerHTML = "Hello"
                        $('body')[0].appendChild(text)
                }],
                ["Rectangle", function() {
                    var morph  = document.createElement("div")
                    morph.style.height = "100px"
                    morph.style.width = "200px"
                    morph.style.backgroundColor = "blue"
                    $('body')[0].appendChild(morph)
                }]
            ]
        }
    }

    lively.components.loadByName("lively-menu")

    var menu = document.createElement("lively-menu")
    var cb = function() {
        console.log("menu initialized")
        menu.openOn(MyApp)
    }
    if (menu.openOn) {
        console.log("initialze directly")
        cb()
    } else {
        console.log("register initialized callback")
        menu.addEventListener("initialized", cb)
    }
    container.appendChild(menu)
    lively.components.loadUnresolved()
}

console.log("loaded context-menu")