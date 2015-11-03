'use strict';

// This is a file editor! 
// Since, it heavily interacts with an HTML page, it should be bundled with it....
// .. because we cannot test it from JavaScript (Karma)

// This is part of the first application called: draft/test.html


// This should become an editor object... with loadFile and saveFile as methods. #TODO #PartsBin

var messaging = require('./messaging.js');
var focalStorage = require('../external/focalStorage.js');
var githubAuth = require('./auth-github.js');

window.githubAuth = githubAuth // make it global, so the callback can reach it...

function currentEditor() {
	 return ace.edit("editor");
}

function getURL(){
	var baseurl = $('#baseurl').val() // How to abstract from UI? #TODO #JensLincke
	var filename = $('#filename').val()
	return new URL(baseurl + filename)
}

export function loadFile(){
	var url = getURL()
	console.log("load " + url)

	$.get(url, null, function(text) {
		currentEditor().setValue(text)
		console.log("file " + url + " read.")
	}).fail(function(e) {
    	console.log('could not load ' + url + ": " + e); // or whatever
	});
}

export function saveFile(){
	var url = getURL()
	console.log("save " + url)
	$.ajax({
	    url: url,
	    type: 'PUT',
	    data: currentEditor().getValue(),
	    success: function(text) {
			console.log("file " + url + " written.")
		},
		error: function(xhr, status, error) {
			console.log("could not write " + url + ": " + error)
		}
	});

}

