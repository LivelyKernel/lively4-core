/*
 * HTTP Dropbox access.
 */

import { Base, Stat, StatNotFoundError, File, FileNotFoundError } from './base.js'
import * as util from '../util.js'
import * as cache from '../cache.js'

/*
 * See https://www.dropbox.com/developers-v1/core/docs
 */

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
    let name = json['path'].split('/').pop()

    if(json['is_dir'] === true)
      type = 'directory'

    var result = {
      type: type,
      name: name,
      size: json['size']
    }
    
    
    
    return result 
  }

  async stat(path, request, no_cache=false) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer

    var showversions  = request.headers.get("showversions")
    if (showversions) {
      var revisionParameters = "?rev_limit=100"
      var revisionRequest = new Request('https://api.dropboxapi.com/1/revisions/auto/' + this.subfolder + path + revisionParameters, {headers: dropboxHeaders});
      
      var revisions = await fetch(revisionRequest).then(r => r.json());
      var revisionContents = {
        // #TODO the API we use in the lively-editor and lively4-server are currently a proof of concept and should be unified to something with better names... etc
        versions: revisions.map(ea => {
            return {
              version: ea.rev,
              date: ea.modified,
              author: "unknown",
              comment: "no comment",
              size: ea.size
            }
        })
      };
      
      var isDirectory = false; // versions of a directory?
      return new Stat(isDirectory, revisionContents, ['GET', 'OPTIONS']);
    }

    let dropboxRequest = new Request('https://api.dropboxapi.com/1/metadata/auto' + this.subfolder + path, {headers: dropboxHeaders})

    let response = undefined

    if (!no_cache) {
      if (navigator.onLine) {
        response = await cache.match(dropboxRequest, 1 * 1000 /* 1sec max cache age */)
      } else {
        response = await cache.match(dropboxRequest)
      }
    } else {
      cache.purge(dropboxRequest);
    }

    if (response === undefined) {
      response = await self.fetch(dropboxRequest)
      cache.put(dropboxRequest, response)
      response = response.clone()
    }

    util.responseOk(response, StatNotFoundError)

    let json  = await response.json()
    if (json['is_deleted']) {
      throw new Error('File has been deleted');
    }
    let dir = false
    var contents; 
    if(json['contents']) {
      dir = true
      contents = await Promise.all(Array.from(json['contents'], item => this.statinfo(item)))
    } else {
      contents = await this.statinfo(json)
    }
    return new Stat(dir, contents, ['GET', 'OPTIONS'])
  }
  
  extractMetadata(response) {
    var metadata = response.headers.get("x-dropbox-metadata");
    if (metadata) {
      return JSON.parse(metadata)
    } else {
      return {}
    }
  }


  async read(path, request, no_cache=false) {
    let dropboxHeaders = new Headers();
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token);

    let dropboxParameter = "";
    let fileversion = request.headers.get("fileversion");
    if (fileversion) dropboxParameter = "?rev=" +fileversion;

    let dropboxRequest = new Request('https://content.dropboxapi.com/1/files/auto' + this.subfolder + path + dropboxParameter, {headers: dropboxHeaders});

    let response = undefined;

    if (!no_cache) {
      if (navigator.onLine) {
        response = await cache.match(dropboxRequest, 5 * 60 * 1000 /* 5 minute max cache age */)
      } else {
        response = await cache.match(dropboxRequest)
      }
    } else {
      cache.purge(dropboxRequest);
    }

    if (response === undefined) {
      response = await self.fetch(dropboxRequest)
      cache.put(dropboxRequest, response)
      response = response.clone()
    }

    util.responseOk(response, FileNotFoundError)

    let blob = await response.blob()
    var file = new File(blob)  
    
    file.fileversion = this.extractMetadata(response).rev
    return file
  }

  async write(path, fileContent, request) {
    let fileContentFinal = await fileContent
    let dropboxHeaders = new Headers()
    let dropboxPath = this.subfolder + path;
    var conflictversion;

    // clear caches
    let dropboxRequest = new Request('https://content.dropboxapi.com/1/files/auto' + dropboxPath, 
       {headers: dropboxHeaders})
    await cache.purge(dropboxRequest);

    // #TODO we could fill the cache with it... with the cache.put API

    dropboxHeaders.append('Authorization', 'Bearer ' + this.token)
    dropboxHeaders.append("Content-Length", fileContentFinal.length.toString())
    
    var parameters = ""
    var lastversion = request.headers.get("lastversion")
    if (lastversion && lastversion != "null") {
      console.log("put with last version: " + lastversion)
      parameters += "?parent_rev="+lastversion + "&" +"autorename=false"
    }
    let response = await self.fetch('https://content.dropboxapi.com/1/files_put/auto' + dropboxPath + parameters, {method: 'PUT', headers: dropboxHeaders, body: fileContentFinal})

    if(response.status == 409) {
      
      let metaRequest = new Request('https://api.dropboxapi.com/1/metadata/auto' + dropboxPath, {headers: dropboxHeaders})
      var metainfo = await fetch(metaRequest).then(r => r.json())
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
    
    /* Sample response 
    {
      "size": "225.4KB",
      "rev": "35e97029684fe",
      "thumb_exists": false,
      "bytes": 230783,
      "modified": "Tue, 19 Jul 2011 21:55:38 +0000",
      "path": "/Getting_Started.pdf",
      "is_dir": false,
      "icon": "page_white_acrobat",
      "root": "dropbox",
      "mime_type": "application/pdf",
      "revision": 220823
    }*/   
    
    
    var headers = {
        fileversion: metadata.rev,
    }
    if (conflictversion) headers.conflictversion = conflictversion;
    return new Response(null, {
      headers: headers,
      status: 200})
  }
  
  
  async del(path, request) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer

    var dropboxPath = this.subfolder + path

    var deleteRequest = new Request('https://api.dropboxapi.com/1/fileops/delete?root=auto&path=' + dropboxPath, {headers: dropboxHeaders});

    var response = await fetch(deleteRequest)
    if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    
    return new Response("deleted " + dropboxPath, {
      headers: {},
      status: 200})
  }
  
  async makeDir(path, request) {
    
    let dropboxHeaders = new Headers()
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

console.log("dropbox loaded")

