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
  
  get bearerToken() { return `Bearer ${this.token}`; }
  
  getDefaultHeaders() {
    let dropboxHeaders = new Headers();
    dropboxHeaders.append('Authorization', this.bearerToken); // Bearer
    dropboxHeaders.append('content-type', "application/json");
    
    return dropboxHeaders;
  }
  
  getMetaData(path) {
    return fetch(new Request('https://api.dropboxapi.com/2/files/get_metadata', {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path })
    }));
  }
  
  listFolder(path) {
    return fetch(new Request('https://api.dropboxapi.com/2/files/list_folder', {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path })
    })).then(r => r.json());
  }

  downloadFile(path) {
    return fetch(new Request('https://content.dropboxapi.com/2/files/download', {
      method: "POST",
      headers: {
        "Authorization": this.bearerToken,
        "Dropbox-API-Arg": JSON.stringify({ path })
      }
    }));
  }
  
  deleteFile(path) {
    return fetch(new Request('https://api.dropboxapi.com/2/files/delete', {
      method: "POST",
      headers: this.getDefaultHeaders(),
      body: JSON.stringify({ path })
    }))
  }

  async stat(path, request) {
    const dropboxPath = this.subfolder + path;

    let response = await this.getMetaData(dropboxPath);
    util.responseOk(response, StatNotFoundError);

    let json = await response.json();
    if (json['is_deleted']) {
      throw new Error('File has been deleted');
    }
    
    function statinfo(json) {
      return {
        type: json['is_dir'] ? 'directory' : 'file',
        name: json['name'],
        size: json['size']
      };
    }

    let contents;
    const isDir = json['.tag'] == "folder";
    if(isDir) {
      const folderResponse = await this.listFolder(dropboxPath);
      contents = await Promise.all(Array.from(folderResponse.entries, statinfo));
      // #TODO deal with paging!
    } else {
      contents = statinfo(json);
    }
    return new Stat(isDir, contents, ['GET', 'OPTIONS']);
  }

  async read(path, request) {
    let fileversion = request.headers.get('fileversion');
    let dropboxParameter = fileversion ? '?rev=${fileversion}' : '';
    
    const dropboxPath = this.subfolder + path + dropboxParameter;
    let response = await this.downloadFile(dropboxPath);
    util.responseOk(response, FileNotFoundError);

    const file = new File(await response.blob());
  
    const metadata = response.headers.get("dropbox-api-result");
    if (metadata) {
      file.fileversion = JSON.parse(metadata).rev;
    }
    
    return file;
  }

  async write(path, fileContent, request) {
    const content = await fileContent;
    const dropboxPath = this.subfolder + path;

    let lastversion = request.headers.get("lastversion");
    if(!lastversion || lastversion == "null") {
      let response = await this.getMetaData(dropboxPath); // dropboxVersionRequest
      if (response.status == 200) {
        let meta = await response.json();
        lastversion = meta.rev;
      }
    }
    
    const conf = lastversion ?
      {
        path: dropboxPath,
        mode: {
          ".tag": "update",
          update: lastversion
        },
        autorename: false,
        mute: false
      } :
      { path: dropboxPath };

    let response = await fetch(new Request('https://content.dropboxapi.com/2/files/upload', {
      method: "POST",
      headers: {
        "Authorization": this.bearerToken,
        "Content-Length": content.length.toString(),
        "Content-Type": "text/plain; charset=dropbox-cors-hack", // #TODO we cannot write images...
        "Dropbox-API-Arg": JSON.stringify(conf)
      },
      body: content
    }));

    let conflictversion;
    if(response.status === 409) {
      let metainfo = await this.getMetaData(dropboxPath).then(r => r.json());
      conflictversion = metainfo.rev;
      console.log(`found conflict with ${conflictversion}`);
    } else if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText);
    }
    
    // the metadata is not in the header, but now in the return value
    let metadata;
    try {
      metadata = await response.json();
    } catch(e) {
      throw new Error(`[swx.fs.dropbox] Could not parse metadata: ${metadata}`);
    }
    
    return new Response(null, {
      status: 200,
      headers: {
        fileversion: metadata.rev,
        conflictversion: conflictversion
      }
    });
  }

  async del(path, request) {
    const dropboxPath = this.subfolder + path;
    let response = await this.deleteFile(dropboxPath);
    if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    
    return new Response(`deleted ${dropboxPath}`, {
      headers: {},
      status: 200
    })
  }
  
  // #TODO not implemented yet -> do it for v2
  // promise: jens will do this if stefan helps him clean up this mess... 
  async makeDir(path, request) {
  /*
    
    let dropboxHeaders = new Headers();
    dropboxHeaders.append('Authorization', this.bearerToken) // Bearer

    const dropboxPath = this.subfolder + path

    let makeDirRequest = new Request('https://api.dropboxapi.com/1/fileops/create_folder?root=auto&path=' + dropboxPath, {headers: dropboxHeaders});

    let response = await fetch(makeDirRequest)
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

