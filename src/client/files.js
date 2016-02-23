'use strict';


export function loadFile(urlString){
	var url = new URL(urlString);
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

export function saveFile(urlString, data){
  return new Promise((resolve, reject) => {
  	var url = new URL(urlString)
  	$.ajax({
	    url: url,
	    type: 'PUT',
	    data: data,
	    success: function(text) {
        console.log("file " + url + " written.");
        resolve(data);
      },
  		error: function(xhr, status, error) {
  			console.log("could not write " + url + ": " + error)
        reject(error)
  		}
  	});
  });
}

export function statFile(urlString){
	var url =  new URL(urlString)
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

console.log("loaded file-editor.js")
