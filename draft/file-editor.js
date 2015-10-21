'use strict';

var messaging = require('./../src/client/messaging.js');
var focalStorage = require('./../src/external/focalStorage.js');
var githubAuth = require('./authgithub.js');

window.githubAuth = githubAuth // make it global, so the callback can reach it...

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
	        	token: localStorage.GithubToken,
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


export function loadfileFetch(){
	var filename = $('#filename').val()
	log("load " + filename)


	$.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/" + filename, null, function(text) {
		currentEditor().setValue(text)
		log("file " + filename + " read.")
	}).fail(function(e) {
    	log('could not load ' + filename + ": " + e); // or whatever
	});
}

function writeFile(path, content) {
	return messaging.postMessage({
	    meta: {
	        type: 'github api'
	    },
	    message: {
	        credentials: {
	        	token: localStorage.GithubToken,
	        	auth: 'oauth'
	        },
	        topLevelAPI: 'getRepo',
	        topLevelArguments: ['livelykernel', 'lively4-core'],
	        method: 'write',
	        args: ['gh-pages', path, content, 'auto commit']
	    }
	}).then(function(event) {
		return event;
	});
}

export function savefile(){
	var filename = $('#filename').val()
	log("save " + filename)

	writeFile(filename, currentEditor().getValue()).then(function(text) {
		log("file " + filename + " written.", text)
	});
}

export function savefileFetch(){
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

