'use strict';

// This is a file editor!
// Since, it heavily interacts with an HTML page, it should be bundled with it....
// .. because we cannot test it from JavaScript (Karma)

// This is part of the first application called: draft/test.html


// This should become an editor object... with loadFile and saveFile as methods. #TODO #PartsBin

import * as messaging from './messaging.js';
import * as githubAuth from './auth-github.js';

window.githubAuth = githubAuth // make it global, so the callback can reach it...

function currentEditor() {
	 return ace.edit("editor");
}

function getURL(){
	var baseurl = $('#baseurl').val() // How to abstract from UI? #TODO #JensLincke
	var filename = $('#filename').val()
	return new URL(baseurl + filename)
}

export function loadFile(urlString){
	var url = urlString ? new URL(urlString) : getURL();
	console.log("load " + url)

	return new Promise((resolve, reject) => {
		$.get(url, null, function(text) {
			// this should not be done here! - Felix
			// currentEditor().setValue(text)
			console.log("file " + url + " read.")
			resolve(text);
		}).fail(function(e) {
	    	console.log('could not load ' + url + ": " + e); // or whatever
	    	reject();
		});
	});
}

export function saveFile(urlString){
  return new Promise((resolve, reject) => {
  	var url = urlString ? new URL(urlString) : getURL();
  	console.log("save " + url)
    var data = currentEditor().getValue();
  	$.ajax({
  	    url: url,
  	    type: 'PUT',
  	    data: data,
  	    success: function(text) {
  			 console.log("file " + url + " written."
          resolve(data)
        )
  		},
  		error: function(xhr, status, error) {
  			console.log("could not write " + url + ": " + error)
        reject(error)
  		}
  	});
  })
}

export function statFile(urlString){
	var url = urlString ? new URL(urlString) : getURL();
	console.log("stat " + url)

	return new Promise(function(resolve, reject) {
		$.ajax({
	    url: url,
	    type: 'OPTIONS',
	    success: function(text) {
				console.log("file " + url + " stated.")
				// this should not be done here! - Felix
				// currentEditor().setValue(text)
				resolve(text);
			},
			error: function(xhr, status, error) {
				console.log("could not stat " + url + ": " + error)
				reject(error);
			}
		});
	})
}

console.log("loaded file-editor")
