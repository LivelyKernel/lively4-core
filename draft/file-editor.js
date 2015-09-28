'use strict';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../serviceworker-loader.js', {
        scope: "https://livelykernel.github.io/lively4-core"
    }).then(function(registration) {
        // Registration was successful
        alert('ServiceWorker registration successful with scope: ', registration.scope);
        navigator.serviceWorker.ready.then(function() {
        	alert('READY');
		});
    }).catch(function(err) {
        // registration failed
        alert('ServiceWorker registration failed: ', err);
    });
}

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

