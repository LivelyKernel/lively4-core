# Uniefied Listings for CloudStorage (ServiceWorker Directory API)

Lively Kernels WebResource was our Swiss Army knife when it came to files and directories in the Web. We relied on Apache's and later node.js's (LiveStar?) WebDAV implementation. 

## WebDAV Example 

When one browses a directory the Web server would generate a nice HTML listing. 
But the WebResource would not parse the HTML file, but ask the server for an XML by adding "Content-Type:text/xml"
to its headers. It would then answer with WebDav. 

```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <D:multistatus xmlns:D="DAV:">
      <D:response xmlns:lp1="DAV:" xmlns:lp2="http://apache.org/dav/props/">
         <D:href>/webwerkstatt/core/</D:href>
         <D:propstat>
            <D:prop>
               <lp1:resourcetype>
                  <D:collection />
               </lp1:resourcetype>
               <lp1:creationdate>2015-07-01T14:15:22Z</lp1:creationdate>
               <lp1:getlastmodified>Wed, 01 Jul 2015 14:15:22 GMT</lp1:getlastmodified>
               <lp1:getetag>"1000-519d0f40f6926"</lp1:getetag>
               <D:supportedlock>[...]</D:supportedlock>
               <D:lockdiscovery />
               <D:getcontenttype>httpd/unix-directory</D:getcontenttype>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
         </D:propstat>
      </D:response>
      ...
      <D:response xmlns:lp1="DAV:" xmlns:lp2="http://apache.org/dav/props/">
         <D:href>/webwerkstatt/core/Greg.js</D:href>
         <D:propstat>
            <D:prop>
               <lp1:resourcetype />
               <lp1:creationdate>2015-07-01T14:15:22Z</lp1:creationdate>
               <lp1:getcontentlength>375</lp1:getcontentlength>
               <lp1:getlastmodified>Wed, 01 Jul 2015 14:15:22 GMT</lp1:getlastmodified>
               <lp1:getetag>"177-519d0f40f6926"</lp1:getetag>
               <lp2:executable>F</lp2:executable>
               <D:supportedlock>[..]</D:supportedlock>
               <D:lockdiscovery />
               <D:getcontenttype>application/javascript</D:getcontenttype>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
         </D:propstat>
      </D:response>
```

This format was hard to work with and we did not make use of its adavanced features like locking etc. anyway. The only advanced feature we used was the access to past versions through the SVNDav Apache module. 

Since we need some form of general file system like API that acts as a facade around Dropbox, Github and other we have to decide of how to do it.

We could implement our own JavaScript CloudStorage Wrapper API, similar to a WebResource and handle all the different resources behind it. But similar to the WebResource approach we would get into difficulties with all software that does not know about it. The most extreme example is an IMG tag. We have to pass it an URI and can only with difficulties use JavaScript for it. And this is point where we think the service worker can help. For files this is easy. But what do we do with meta information like the contents of a directory (a collection in WebDAV terms)?

## Idea: Lightweight JSON for our Unified Rest API

Since we have full control and are on our when it comes how to handle directories, why not use a lightweight JSON approach? 

```JSON
{
  "name": "core/",
  "contents": [
    {
      "name": "file1.js",
    },
    {
      "name": "file2.js",
    }
  ]
}
```

## Example: Dropbox Rest API

We could also take a look at the dropbox, onedrive or github API in that case and could add meta information, like author, modification dates, hashes etc as needed

A snippet from the Dropbox API https://www.dropbox.com/developers-v1/core/docs. The 

The rest request:
```
https://api.dropboxapi.com/1/metadata/auto/<path>
```

gets such an result: 

```json
{
    "size": "0 bytes",
    "hash": "37eb1ba1849d4b0fb0b28caf7ef3af52",
    "bytes": 0,
    "thumb_exists": false,
    "rev": "714f029684fe",
    "modified": "Wed, 27 Apr 2011 22:18:51 +0000",
    "path": "/Photos",
    "is_dir": true,
    "icon": "folder",
    "root": "dropbox",
    "contents": [
        {
            "size": "2.3 MB",
            "rev": "38af1b183490",
            "thumb_exists": true,
            "bytes": 2453963,
            "modified": "Mon, 07 Apr 2014 23:13:16 +0000",
            "client_mtime": "Thu, 29 Aug 2013 01:12:02 +0000",
            "path": "/Photos/flower.jpg",
            "photo_info": {
              "lat_long": [
                37.77256666666666,
                -122.45934166666667
              ],
              "time_taken": "Wed, 28 Aug 2013 18:12:02 +0000"
            },
            "is_dir": false,
            "icon": "page_white_picture",
            "root": "dropbox",
            "mime_type": "image/jpeg",
            "revision": 14511
        }
    ],
    "revision": 29007
}
```

## Our design

When working with Lively's WebResource we introduced our own virtual protocols to distinguish the various CloudStorage resources. An URL look like

```
dropbox:///<path>
```
or
```
onedrive:///<path>
```

We know that these are very context specific URLs like localhost. Your localhost is not my localhost and the same as your dropbox is not my dropbox. But since we the contents of a dropbox is not universally accessible we thought this was ok. 

When trying to move this approach to a Service worker we realized that we could not use our custom protocols but had to come up with something different, since we had to use HTTPS as protocol. So we changed the format to: 
```
https://dropbox/<path> 
```
where we assume that "dropbox" is no valid domain... and to be on the safer side we could create our own virtual top level domain like "dropbox.lively4". A problem with using such urls and showing them to the user is that they are still context specific and can not be send around in an email. But this is a share by file names is general. Nobody expects to see the same file when someone refers to "/etc/passwd".


## Example OneDrive

Microsoft's OneDrive on the other hand does not navigate it's file structure with paths, but every file and folder has an id. https://msdn.microsoft.com/en-us/library/office/dn659743.aspx 

```json
GET https://apis.live.net/v5.0/me/skydrive?access_token=ACCESS_TOKEN
---
200 OK
{
    "id": "folder.a6b2a7e8f2515e5e", 
    ...
    "upload_location": "https://apis.live.net/v5.0/folder.a6b2a7e8f2515e5e/files",
    ...
    "type": "folder",
    ...
}
---
GET https://apis.live.net/v5.0/folder.a6b2a7e8f2515e5e/files?access_token=ACCESS_TOKEN
---
200 OK
{
    "data": [
        {
            "id": "folder.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!110", 
            ...
            "upload_location": "https://apis.live.net/v5.0/folder.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!110/files/"
            ...
            "type": "folder",
            ...
        }, {
            "id": "photo.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!131", 
            ...
            "upload_location": "https://apis.live.net/v5.0/photo.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!131/content/", 
            ...
            "type": "photo",
            ...
        }, {
            "id": "file.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!119", 
            ...             
            "upload_location": "https://apis.live.net/v5.0/file.a6b2a7e8f2515e5e.A6B2A7E8F2515E5E!119/content/", 
            ...
            "type": "file", 
            ...
        }
    ]
}
```

