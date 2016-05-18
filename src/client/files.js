'use strict';

import focalStorage from './../external/focalStorage.js'

import generateUuid from './uuid.js'

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

  static async loadFile(urlString) {
    var path = this.getGoogledrivePath(urlString);
    if(path) {
      var id = await this.googlePathToId(path);
      if(!id) {
        return Promise.reject('No file found');
      } else {
        return this.googleAPIFetch(`files/`+id)
          .then(r => r.json())
          .then(metaData => {
            var m =metaData.mimeType.match(/application\/vnd.google-apps\.(.*)/)
            if( m) {
          		// Need conversion for Google Document types

        			var type = m[1]
              if (type == "spreadsheet") {
          			return this.googleAPIFetch(`files/`+id + '/export?mimeType=text/csv')
          			  .then(r => r.text())            
              } else if (type == "drawing") {
                // #TODO svg+xml does not seem to work any more? 
                // we can only display this (easily) when this code moves into the service worker
          			return this.googleAPIFetch(`files/`+id + '/export?mimeType=application/pdf')
          			  .then(r => r.text())            
              } else {
                
          			return this.googleAPIFetch(`files/`+id + '/export?mimeType=text/html')
          			  .then(r => r.text())              
              } 
        		} else {
        			// download file
        			return this.googleAPIFetch(`files/`+id + '?alt=media').then(r => r.text())
        		}
        });
      }
    }

    urlString = "" + urlString
    if(urlString.match('https://lively4/googled/')) {
      return Promise.resolve('no content2');
      
    }
    var url = new URL(urlString);
    return fetch(url).then(function (response, err) {
      if (err) {
        console.log("Err: ",  err)
      }
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  static async saveFile(urlString, data){
    var path = this.getGoogledrivePath(urlString);
    if(path) {
      var id = await this.googlePathToId(path);
      if(!id) {
        var folderPath = path.replace(/\/[^\/]*$/,"");
        var fileName = path.replace(/.*\//,"")
        var folderId = await this.googlePathToId(folderPath);
        if (!folderId) return Proise.reject(`Folder $(folderPath) does not exit`);
        return focalStorage.getItem("googledriveToken").then( async (token) => {
          var delim = generateUuid()
          var body = `--${delim}
Content-Type: application/json; charset=UTF-8

{
  title: "${fileName}",
  parents: [
    {kind: "drive#folder", id: "${folderId}"}
  ]
}

--${delim}
Content-Type: text/plain; charset=UTF-8

`+data+`

--${delim}--`
          return fetch('https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart', {
	          method: 'POST',
          	headers: new Headers({
          		"Content-Type": "multipart/related; boundary=" + delim,
          		Authorization: "Bearer " + token,
          		"Content-Length": body.length
          	}),
          	body: body
})
      })
        
        
        // return Promise.reject('No file found');
      } else {
        return this.googleAPIUpload(id, data);
      }
    }
    
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
  static getGoogledrivePath(urlString) {
    urlString = '' + urlString;
    var m = urlString.match(/https:\/\/lively4\/googled(\/.*)/);
    return m && m[1];
  }
  static async googleAPIUpload(id, content, mimeType) {
    
    return focalStorage.getItem("googledriveToken").then( async (token) => {
      var headersDesc = {
  			Authorization: "Bearer " + token
  		};

      if (!mimeType) 
        mimeType = (await (await this.googleAPIFetch('files/' + id )).json()).mimeType;
      
      headersDesc['Content-Type'] = mimeType; 

      return fetch('https://www.googleapis.com/upload/drive/v2/files/' + id + '?uploadType=media', {
    		method: 'PUT',
    		headers: new Headers(headersDesc),
    		body: content
    	})
    })
  }
  static async googleAPIFetch(string) {
    return focalStorage.getItem("googledriveToken").then( token => fetch(`https://www.googleapis.com/drive/v2/` + string, {
    		method: 'GET',
    		headers: new Headers({
    			Authorization: "Bearer " + token
    		}),
    	})
  	)
  }
  static async googlePathToId(path) {
    if(!path) { return undefined; }
    if(path === '/') { return 'root'; }
    
    var parentId ='root';
    path = path.replace(/^\//, '').split('/')
    while(path.length > 0 ) {
      let childName = path.shift();
      if(childName === '') { return parentId; }
      let childItem = await this.googleAPIFetch(`files?corpus=domain&q=%27`+ parentId+`%27%20in%20parents`)
      .then(r => r.json())
      .then(json => {
	      return json.items.find(item => item.title === childName)
	    });
    	if(!childItem) { return undefined; } // file not found
      parentId = childItem.id;
    }
    
    return parentId;
  }
  static async statFile(urlString){
    var path = this.getGoogledrivePath(urlString);
    if(path) {
      var id = await this.googlePathToId(path);
      return this.googleAPIFetch(`files?corpus=domain&q=%27`+id+`%27%20in%20parents`)
        .then(r => r.json())
        .then(json => {
      	  console.log(path, json, urlString);
          var items = json.items.map(item => ({
      	    "type": item.mimeType === 'application/vnd.google-apps.folder' && true ? "directory" : 'file',
			      "name": item.title,
			      "size": 0
      	  }));
      	  return JSON.stringify({
          	"type": "directory",
          	"contents": items
          });
      });
    }
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
