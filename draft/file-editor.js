'use strict';

var messaging = require('./../src/client/messaging.js');

function currentEditor() {
	 return ace.edit("editor");
}

function readFile(path) {
	return messaging.postMessage({
	    meta: {
	        type: 'github api'
	    },
	    message: {
	        credentials: {
	        	token: "8f82ede5bfa2128fbe1da3812b7e37c422884916",
	        	auth: 'oauth' 
	        },
	        topLevelAPI: 'getRepo',
	        topLevelArguments: ['livelykernel', 'lively4-core'],
	        method: 'read',
	        args: ['gh-pages', path]
	    }
	}).then(function(event) {
		return event.data.message;
	});
}

export function loadfile(){
	var filename = $('#filename').val()
	log("load " + filename)

	readFile(filename).then(function(text) {
		currentEditor().setValue(text)
		log("file " + filename + " read.")
	})
}

export function savefile(){
	log("Text: " + 	currentEditor().getValue())
}

