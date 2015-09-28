

function loadfile(){
	alert("load file")
	$('#editor').setValue("Hello World")
}


function savefile(){
	alert("Text: " + 	$('#editor').getValue())
}

