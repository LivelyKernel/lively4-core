# Jens' Workspace

# TODO

[] add Syntax Highlighting to ACE editor
[] add keyboard bingings to ace editor
	- save file
	- eval selection (print and do)


# Menus as Lists...

menu.openOn({
        getMenuItems: function(){
            return [
                ["world",       () => alert("hello")]
             ]
        }})


lively.components.openIn($('body')[0], menu)
