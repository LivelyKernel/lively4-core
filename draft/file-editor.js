'use strict';


function currentEditor() {
	 return ace.edit("editor");
}


export function readFile(path) {
	 var messaging = require('./../src/client/messaging.js');

	messaging.postMessage({
    meta: {
        type: 'github api'
    },
    message: {
        credentials: GITHUB_CREDENTIALS,
        topLevelAPI: 'getRepo',
        topLevelArguments: ['Lively4', 'manuallycreated'],
        method: 'read',
        args: ['master', 'README.md']
    }
}).then(function(event) {
    console.log('--------------------------------');
    console.log(event.data.message);
    try {
        expect(event.data.message).to.match(/^# manuallycreated/);
    } catch(e) {
        console.error(e);
        throw e;
    }
    done();
});


}


export function loadfile(){

	var filename = $('#filename').val()
	console.log("load " + filename)

	currentEditor().setValue("Hello World")
}


function savefile(){
	alert("Text: " + 	currentEditor().getValue())
}

