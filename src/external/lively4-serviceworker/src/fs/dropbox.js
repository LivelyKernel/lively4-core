/*
 * HTTP Dropbox access.
 */

import { Base, Stat, StatNotFoundError, File, FileNotFoundError } from './base.js'
import * as util from '../util.js'

export default class Filesystem extends Base {
  constructor(path, options) {
    super('dropbox', path, options)

    if(options.token) {
      this.token = options.token
    } else {
      throw new Error("[dropbox] bearer auth token required")
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
    let name = json['name']

    if(json['is_dir'] === true)
      type = 'directory'

    var result = {
      type: type,
      name: name,
      size: json['size']
    }
    
    return result 
  }
  
  getDefaultHeaders() {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer
    dropboxHeaders.append('content-type', "application/json")
    
    return dropboxHeaders;
  }

  dropboxRequest(endpoint, path) {
    return new Request('https://api.dropboxapi.com/' + endpoint, {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path:  path})
    })
  }
  
  async stat(path, request) {
    console.log("dropbox stat: " + this.subfolder + path)
    let dropboxPath =  this.subfolder + path;
    let dropboxRequest = new Request('https://api.dropboxapi.com/2/files/get_metadata', {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path: dropboxPath})
    })

    let response = undefined

    if (response === undefined) {
      response = await self.fetch(dropboxRequest)
      response = response.clone()
    }

    util.responseOk(response, StatNotFoundError)

    let json  = await response.json()
    if (json['is_deleted']) {
      throw new Error('File has been deleted');
    }
    let dir = false
    var contents; 
    if(json['.tag'] == "folder") {
      dir = true;
      contents = await Promise.all(Array.from(
        (await self.fetch(this.dropboxRequest("2/files/list_folder", dropboxPath)).then(r => r.json())).entries, 
        item => this.statinfo(item))) 
      // #TODO deal with paging!
    } else {
      contents = await this.statinfo(json)
    }
    return new Stat(dir, contents, ['GET', 'OPTIONS'])
  }
  
  extractMetadata(response) {
    var metadata = response.headers.get("dropbox-api-result");
    if (metadata) {
      return JSON.parse(metadata)
    } else {
      return {}
    }
  }

  async read(path, request) {
    let dropboxParameter = "";
    let fileversion = request.headers.get("fileversion");
    if (fileversion) dropboxParameter = "?rev=" +fileversion;

    let dropboxPath = this.subfolder + path + dropboxParameter
    let dropboxRequest = new Request('https://content.dropboxapi.com/2/files/download', {
      method: "POST",
      headers: {
        "Authorization": 'Bearer ' + this.token,
        "Dropbox-API-Arg": JSON.stringify({path: dropboxPath})
      }
    });

    let response = await self.fetch(dropboxRequest);
    util.responseOk(response, FileNotFoundError)

    let blob = await response.blob()
    var file = new File(blob)  
    
    file.fileversion = this.extractMetadata(response).rev
    return file
  }

  async write(path, fileContent, request) {
    let fileContentFinal = await fileContent
    let dropboxPath = this.subfolder + path;
    var conflictversion;

    // var parameters = ""
    var lastversion = request.headers.get("lastversion")
    var conf = {
          path: dropboxPath
        }
    
    if (!lastversion || lastversion == "null") {
      let dropboxVersionRequest = new Request('https://api.dropboxapi.com/2/files/get_metadata', {
        method: "POST",
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ path: dropboxPath})
      })
      var resp = await fetch(dropboxVersionRequest)
      // if (resp.statusText == "Conflict") // 409
      if (resp.status == 200) {
        var meta = await resp.json()
        lastversion = meta.rev
      }
    }
    if (lastversion) {
      Object.assign(conf, {
        mode: {
          ".tag": "update",
          "update": lastversion
        },  
        "autorename": false,
        "mute": false
      })      
    } 

    let response = await self.fetch(new Request('https://content.dropboxapi.com/2/files/upload', {
      method: "POST",
      headers: {
        "Authorization": 'Bearer ' + this.token,
        "Content-Length": fileContentFinal.length.toString(),
        "Content-Type": "text/plain; charset=dropbox-cors-hack", // #TODO we cannot write images...
        "Dropbox-API-Arg": JSON.stringify(conf)
      },
      body: fileContentFinal
    }));

    if(response.status == 409) {
      let metainfo = await self.fetch('https://api.dropboxapi.com/2/files/get_metadata', {
          method: "POST",
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({ path: dropboxPath})
        }).then(r => r.json())
      
      conflictversion = metainfo.rev
      console.log("found conflict with " + conflictversion )      
    } else if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    
    // the metadata is not in the header, but now in the return value
    let metadata = await response.text();
    try {
      metadata = JSON.parse(metadata)
    } catch(e) {
      throw new Error("[swx.fs.dropbox] Could not parse metadata: " + metadata)
    }
    
    var headers = {
        fileversion: metadata.rev,
    }
    if (conflictversion) headers.conflictversion = conflictversion;
    return new Response(null, {
      headers: headers,
      status: 200})
  }
  
  
  async del(path, request) {
    var dropboxPath = this.subfolder + path

    var deleteRequest = new Request('https://api.dropboxapi.com/2/files/delete', {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path: dropboxPath})
    });

    var response = await fetch(deleteRequest)
    if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    
    return new Response("deleted " + dropboxPath, {
      headers: {},
      status: 200})
  }
  
  // #TODO not implemented yet -> do it for v2
  // promise: jens will do this if stefan helps him clean up this mess... 
  async makeDir(path, request) {
    
    let dropboxHeaders = new Headers();
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer

    var dropboxPath = this.subfolder + path

    var makeDirRequest = new Request('https://api.dropboxapi.com/1/fileops/create_folder?root=auto&path=' + dropboxPath, {headers: dropboxHeaders});

    var response = await fetch(makeDirRequest)
    if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    
    return new Response("created directory:  " + dropboxPath, {
      headers: {},
      status: 200})
  }
  
}

console.log("dropbox loaded!")

