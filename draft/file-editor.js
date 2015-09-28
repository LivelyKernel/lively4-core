
function currentEditor() {
	 return ace.edit("editor");
}


function loadfile(){
	alert("load file")

	currentEditor().setValue("Hello World")
}


function savefile(){
	alert("Text: " + 	currentEditor().getValue())
}

