/*
 * HTTP Google Drive access.
 */

import { Base } from './base.jsx'
import * as util from '../util.jsx'

export default class Filesystem extends Base {
  constructor(path, options) {
      super('googledrive', path, options)

      if(options.token) {
          this.token = options.token
      } else {
          throw new Error("[googledrive] bearer auth token required")
      }

      if(options.subfolder) {
          this.subfolder = options.subfolder
          if (this.subfolder[0] != '/') {
              this.subfolder = '/' + this.subfolder
          }
      } else {
          this.subfolder = ''
      }
  }

  async statinfo(json) {
      let type = 'file'
      let name = json['path'].split('/').pop()

      if(json['is_dir'] === true)
          type = 'directory'

      return {
          type: type,
          name: name,
          size: json['size']
      }
  }

  
  async stat(relativePath){
    var path = this.getGoogledrivePath(relativePath);
    var id = await this.googlePathToId(path);
    return this.googleAPIFetch(`files?corpus=domain&q=%27`+id+`%27%20in%20parents`)
      .then(r => r.json())
      .then(json => {
    	  console.log(path, json, relativePath);
        var items = json.items.map(item => ({
    	    "type": item.mimeType === 'application/vnd.google-apps.folder' && true ? "directory" : 'file',
		      "name": item.title,
		      "size": 0
    	  }));
    	  return JSON.stringify({
        	"type": "directory",
        	"contents": items
        });
    }).then( content =>
      new Response(content, {
          status: 200,
          headers: {'Allow': 'GET,OPTIONS'}
      })
    )
  }

  async read(path) {
      let googledriveHeaders = new Headers()
      googledriveHeaders.append('Authorization', 'Bearer ' + this.token)
      let response = await self.fetch('https://content.dropboxapi.com/1/files/auto' + this.subfolder + path, {headers: googledriveHeaders})

      if(response.status < 200 && response.status >= 300) {
          throw new Error(response.statusText)
      }

      let blob = await response.blob()

      return new Response(blob, {
          status: 200
      })
  }

  async write(path, fileContent) {
      let fileContentFinal = await fileContent
      let googledriveHeaders = new Headers()

      googledriveHeaders.append('Authorization', 'Bearer ' + this.token)
      googledriveHeaders.append("Content-Length", fileContentFinal.length.toString())
      let response = await self.fetch('https://content.dropboxapi.com/1/files_put/auto' + this.subfolder + path, {method: 'PUT', headers: googledriveHeaders, body: fileContentFinal})

      if(response.status < 200 && response.status >= 300) {
          throw new Error(response.statusText)
      }

      return fileContent
  }
  
  getGoogledrivePath(relativePath) {
    return this.subfolder + relativePath
  }
  
  async googleAPIUpload(id, content, mimeType) {
    
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
  
  async googleAPIFetch(string) {
    return  fetch(`https://www.googleapis.com/drive/v2/` + string, {
    		method: 'GET',
    		headers: new Headers({
    			Authorization: "Bearer " + this.token
    		}),
    	})
  }

  
  
  async googlePathToId(path) {
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



}
