'use strict';

export default class Files {

  static  fetchChunks(fetchPromise, eachChunkCB, doneCB) {
    fetchPromise.then(function(response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var all = "";
        (function read() {
          reader.read().then(function(result) {
            var text = decoder.decode(result.value || new Uint8Array, {
              stream: !result.done
            });
            all += text
            if (eachChunkCB) eachChunkCB(text, result)
            if (result.done) {
              if (doneCB) doneCB(all, result)
            } else {
              read() // fetch next chunk
            }
          })
        })()
      })
  }

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
  
  static syncRepository(lively4serverUrl, gitrepository, gitusername, gitpasssword, gitemail) {
    return fetch(lively4serverUrl + "/_git/sync", {
      headers: new Headers({ 
    	  "gitrepository": gitrepository, // "Lively4.wiki"
        "gitusername" : gitusername, // "jens.lincke"
        "gitpassword" : gitpasssword, // "f777a0fa178bc855c28f89b402786b36f8b..."
        "gitemail" : gitemail
      })
    }).then(r => r.text()).then(r => {
      console.log(r); 
      return r
    })
  }
}

console.log("loaded file-editor.js")
