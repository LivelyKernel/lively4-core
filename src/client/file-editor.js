'use strict';

// var a = 2**3

var messaging = require('./messaging.js');
var focalStorage = require('../external/focalStorage.js');
var githubAuth = require('./auth-github.js');

window.githubAuth = githubAuth // make it global, so the callback can reach it...

function currentEditor() {
	 return ace.edit("editor");
}

export function loadFile(){
	var filename = $('#filename').val()
	log("load " + filename)


	$.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/" + filename, null, function(text) {
		currentEditor().setValue(text)
		log("file " + filename + " read.")
	}).fail(function(e) {
    	log('could not load ' + filename + ": " + e); // or whatever
	});
}

export function saveFile(){
	var filename = $('#filename').val()
	log("save " + filename)

	$.ajax({
	    url: "https://github.lively4/repo/livelykernel/lively4-core/gh-pages/" + filename,
	    type: 'PUT',
	    data: currentEditor().getValue(),
	    success: function(text) {
			log("file " + filename + " written.")
		},
		error: function(xhr, status, error) {
			log("could not write " + filename + ": " + error)
		}
	});

}

