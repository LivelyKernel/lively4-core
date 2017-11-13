# Dropbox API


```JS
// Interactive Workspaces. 
// Please go to edit mode (for now) and execute each stage indiviually. 
// Use CMD+P to eval and print it.

import auth from 'src/client/auth-dropbox.js';

var path = "/Lively/foo.txt";
var contents;
```

## 1. Get Access Token

```JS
let dropboxHeaders = new Headers();

auth.challengeForAuth(Date.now(), token => {
	var bearer= token;
	dropboxHeaders.append('Authorization', 'Bearer ' + bearer) // Bearer
});
```

## 2. Optionally check the meta information about this file

```JS

var startTime = Date.now()

let infoRequest = new Request('https://api.dropboxapi.com/1/metadata/auto' + path, {headers: dropboxHeaders});
await fetch(infoRequest).then(r => r.text());
Date.now() - startTime 
// from 500ms to 1000ms
```

And the result...

```
{"read_only": false, 
"parent_shared_folder_id": "1158290734", 
"revision": 170, 
"bytes": 137, 
"thumb_exists": false, 
"rev": "aa450a1d2e", 
"modified": "Fri, 02 Dec 2016 12:56:28 +0000", 
"mime_type": "text/plain", 
"size": "137 bytes", 
"path": "/Lively4/foo.txt", 
"is_dir": false, 
"modifier": {"email_verified": true, "display_name": "Jens Lincke", "uid": 13189987, 
            "email": "jensl81@gmx.de"}, 
"root": "dropbox", 
"client_mtime": "Fri, 02 Dec 2016 12:56:27 +0000", 
"icon": "page_white_text"}

```


## 3. Get file contents file contents

```JS
var startTime = Date.now()

let request = new Request('https://content.dropboxapi.com/1/files/auto' + path, {headers: dropboxHeaders})
var resultHeaders;
await fetch(request).then(r => {
  resultHeaders = r.headers;
  return r.text()
}).then(t => {
	contents = t
	return contents
})

Date.now() - startTime
```

Lets have a look at the headers

```
var s = ""
for (var ea of resultHeaders) {
  s += ea[0] +":" + ea[1] + "\n"  
};
s
```

will give you

```
x-dropbox-request-id:3f693a092695e16f8a5326e8faccafb2
content-length:137
pragma:public
x-server-response-time:241
content-type:text/plain; charset=utf-8
cache-control:max-age=0
accept-ranges:bytes
x-dropbox-metadata:{"parent_shared_folder_id": "1158290734", "rev": "aa450a1d2e", "thumb_exists": false, "path": "/Lively4/foo.txt", "is_dir": false, "client_mtime": "Fri, 02 Dec 2016 12:56:27 +0000", "icon": "page_white_text", "read_only": false, "modifier": {"email_verified": true, "display_name": "Jens Lincke", "uid": 13189987, "email": "jensl81@gmx.de"}, "bytes": 137, "modified": "Fri, 02 Dec 2016 12:56:28 +0000", "size": "137 bytes", "root": "dropbox", "mime_type": "text/plain", "revision": 170}
```

Very good! The revision ``"rev": "aa450a1d2e"`` is already in the  ``x-dropbox-metadata`` header. 

## 4. Change the file contents

```JS

contents += "\nI was here"
let writeRequest = new Request(
	'https://content.dropboxapi.com/1/files_put/auto' + path, {method: 'PUT', headers: dropboxHeaders, body: contents})
fetch(writeRequest).then(r => {
  return r.text() 
})
```

Interestingly, the metadata is not in the header but in the body...

```
{"revision": 3154325, 
"bytes": 214, 
"thumb_exists": false, 
"rev": "30219501397f44", 
"modified": "Fri, 02 Dec 2016 17:24:31 +0000", 
"shareable": false, 
"mime_type": "text/plain", 
"path": "/Lively/foo.txt", 
"is_dir": false, 
"size": "214 bytes", 
"root": "dropbox", 
"client_mtime": "Fri, 02 Dec 2016 17:24:30 +0000", 
"icon": "page_white_text"}
```



go back to 3. and see the effects



## Future work: Caches

Read

```JS

async function getCached(path)  {
  var cache = await caches.open('lively4-cache')
  let request = new Request('https://content.dropboxapi.com/1/files/auto' + path, 
    {headers: dropboxHeaders})


  var cached = await c.match(request)
  if (cached) {
    return cached
  } else {
    var response = await fetch(request)
    cache.put(request, response.clone())
    response = response
    return response
  }
}

start = Date.now()
s = await getCached("/Lively4/foo.txt").then(r => r.text())
"fetched: " + s + " in " + (Date.now() - start) + "ms"

// 1. fetched: Yo,yo, yo 2 in 516ms
// 2. fetched: Yo,yo, yo 2 in 11ms (yeah, cache works)

``` 


... and write:
```JS
async function putCached(path, contents)  {
  var cache = await caches.open('lively4-cache')
  
  cache.put
  let request = new Request('https://content.dropboxapi.com/1/files/auto' + path, 
     {headers: dropboxHeaders})
  var cached = await c.match(request)
  await cache.delete(request)

  let writeRequest = new Request(
  	'https://content.dropboxapi.com/1/files_put/auto' + path, {method: 'PUT', headers: dropboxHeaders, body: contents})
  return fetch(writeRequest)
}

putCached("/Lively4/foo.txt", "Yo,yo, yo 2").then( r => "done")

```

## Task: Enrich the Dropbox Service worker API with versioning information

We were not overly clever and added "fileversion" header to the response request. 

```
r = await fetch("https://lively4/dropbox/foo.txt")
r.headers.get("fileversion")

// 30219501397f44
```

should return a hash or version number. 
When it detects a conflict on write there should be a "conflictversion" in the response header.

```
r = await fetch("https://lively4/dropbox/foo.txt", {method: "PUT", body: "Hi! HO!" + new Date()})
r.headers.get("fileversion")   
// 30219601397f44

r.headers.get("conflictversion") // when there is a conflict...
```





