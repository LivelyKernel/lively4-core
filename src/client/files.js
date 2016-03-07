'use strict';

export default class Files {

  static  loadFile(urlString) {
    var url = new URL(urlString);
    return fetch(url).then(function (response, err) {
      if (err) {
        console.log("Err: ",  err)
      }
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  static saveFile(urlString, data){
    return new Promise((resolve, reject) => {
    	var url = new URL(urlString)
    	var tried = 0;
      (function trySave() {
        tried += 1;
        $.ajax({
    	    url: url,
    	    type: 'PUT',
    	    data: data,
    	    success: function(text) {
            console.log("file " + url + " written.");
            resolve(data);
          },
      		error: function(xhr, status, error) {
            // We expect the service worker to answer this, this might fail due to the brower
            // anserwring before the service worker is started. So we try again at least once.
            if (tried > 2) {
        			console.log("could not write " + url + ": " + error)
              reject(error)
            } else {
              console.log("try to save again, attempt: " + tried)
              trySave()
            }
      		}
      	});
      })()
    });
  }

  static statFile(urlString){
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
}

console.log("loaded file-editor.js")
