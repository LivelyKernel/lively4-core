/*
 * HTTP Dropbox access.
 */

import { Base, Stat, StatNotFoundError, File, FileNotFoundError } from './base.js'
import * as util from '../util.js'
// import * as cache from '../cache.js'

export default class Filesystem extends Base {
  constructor(path, options) {
    super('dropbox', path, options);

    if (options.token) {
      this.token = options.token;
    } else {
      throw new Error("[dropbox] bearer auth token required");
    }

    if (options.subfolder) {
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
    
    return result;
  }

  dropboxRequest(endpoint, path) {
    let dropboxHeaders = new Headers();
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token); // Bearer
    dropboxHeaders.append('content-type', "application/json");
    
    return new Request('https://api.dropboxapi.com/' + endpoint, {
      method: "POST",
      headers: dropboxHeaders,
      body: JSON.stringify({ path:  path})
    })
  }
  
<<<<<<< HEAD
  async stat(path, request) {
    console.log("dropbox stat: " + this.subfolder + path)
    const dropboxPath =  this.subfolder + path;
    const dropboxRequest = new Request('https://api.dropboxapi.com/2/files/get_metadata', {
=======
  async stat(path, request, no_cache=false) {
    no_cache = true // #DEV
    
    console.log("dropbox stat: " + this.subfolder + path);
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer
    dropboxHeaders.append('content-type', "application/json")
    
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

    let dropboxPath =  this.subfolder + path;
    let dropboxRequest = new Request('https://api.dropboxapi.com/2/files/get_metadata', {
>>>>>>> e2fafe75eca04296720d2891785936087e9c102d
      method: "POST",
      headers: dropboxHeaders,
      body: JSON.stringify({ path: dropboxPath})
    })

<<<<<<< HEAD
    let response = await self.fetch(dropboxRequest)
=======
    let response = undefined

    // if (!no_cache) {
    //   if (navigator.onLine) {
    //     response = await cache.match(dropboxRequest, 1 * 1000 /* 1sec max cache age */)
    //   } else {
    //     response = await cache.match(dropboxRequest)
    //   }
    // } else {
    //   cache.purge(dropboxRequest); // #DEV, caching does not support POST
    // }

    if (response === undefined) {
      response = await self.fetch(dropboxRequest)
      // cache.put(dropboxRequest, response); // #DEV, caching does not support POST
      response = response.clone()
    }
>>>>>>> e2fafe75eca04296720d2891785936087e9c102d

    util.responseOk(response, StatNotFoundError)

    let json  = await response.json()
    if (json['is_deleted']) {
      throw new Error('File has been deleted');
    }
    
    let dir = false
    var contents; 
    if(json['.tag'] == "folder") {
      dir = true
      // contents = await Promise.all(Array.from(json['contents'], item => this.statinfo(item)))
      function makedropboxRequest(endpoint, path) {
        return new Request('https://api.dropboxapi.com/' + endpoint, {
          method: "POST",
          headers: this.getDefaultHeaders(),
          body: JSON.stringify({ path:  path})
        })
      }

      contents = await Promise.all(Array.from(
        (await self.fetch(makedropboxRequest("2/files/list_folder", dropboxPath)).then(r => r.json())).entries,
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

  async read(path, request, no_cache=false) {
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

    let response = undefined;

    // if (!no_cache) {
    //   if (navigator.onLine) {
    //     response = await cache.match(dropboxRequest, 5 * 60 * 1000 /* 5 minute max cache age */)
    //   } else {
    //     response = await cache.match(dropboxRequest)
    //   }
    // } else {
    //   cache.purge(dropboxRequest);
    // }

    if (response === undefined) {
      response = await self.fetch(dropboxRequest)
      // cache.put(dropboxRequest, response)
      // response = response.clone()
    }
    util.responseOk(response, FileNotFoundError)

    let blob = await response.blob()
    var file = new File(blob)  
    
    file.fileversion = this.extractMetadata(response).rev
    return file;
  }

  async write(path, fileContent, request) {
    let fileContentFinal = await fileContent;
    let dropboxHeaders = new Headers();
    let dropboxPath = this.subfolder + path;
    var conflictversion;

    // clear caches
    
    // await cache.purge(dropboxRequest);

    // #TODO we could fill the cache with it... with the cache.put API

    
    
    // var parameters = ""
    var lastversion = request.headers.get("lastversion")
    var conf = {
          path: dropboxPath
        }
    if (lastversion && lastversion != "null") {
      console.log("put with last version: " + lastversion)
      // parameters += "?parent_rev="+lastversion + "&" +"autorename=false"
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
          headers: {
            "Authorization": 'Bearer ' + this.token,
            'Content-Type': "application/json"
          },
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
    
    return new Response(`deleted ${dropboxPath}`, {
      headers: {},
      status: 200
    })
  }
  
  async makeDir(path, request) {
  /*
    
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
  */
  }
  
}

console.log("dropbox loaded!")

