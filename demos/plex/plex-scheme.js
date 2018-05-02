import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

var lastTokenPromted

export class PlexScheme extends Scheme {
  
  get scheme() {
    return "plex"
  }
  
  async plexToken() {
    var token = await focalStorage.getItem("plex-token")
    if(!token && (!lastTokenPromted || ((Date.now() - lastTokenPromted) > 1000 * 5))) { // don't ask again for 5 seconds...
      lastTokenPromted = Date.now()
      token = await lively.prompt("plex token required: ")
      if (token) {
        focalStorage.setItem("plex-token", token)
      }
    }
    return token
  }

  resolve() {
    return true
  }  

 
  
  plexChildren(mediacontent) {
    return Array.from(mediacontent.childNodes).filter(ea => ea.getAttribute)
  }
  
  plexToJSON(mediacontent) {
    
      let obj = {
        _type: mediacontent.tagName
      }
      mediacontent.getAttributeNames().forEach(prop => {
        obj[prop] = mediacontent.getAttribute(prop)
      })
      
      this.plexChildren(mediacontent).forEach(child => {
        
        let tag = child.getAttribute("tag")
        if (tag) {
          if (!obj[child.tagName]) obj[child.tagName] = [];
          obj[child.tagName].push(tag)
        } else if (child.tagName == "Media") {
          if (!obj.media) obj.media = []
           obj.media.push(this.plexToJSON(child))
        } else if (child.tagName == "Part") {
          if (!obj.part) obj.part = []
           obj.part.push(this.plexToJSON(child))
        } else {
          if (!obj.children) obj.children = []
          obj.children.push(this.plexToJSON(child))
        }
        
        // if (prop.tagName == "Media") {
        //   this.plexChildren(mediacontent)[0].getAttribute("file")
        // }
      })
      
      return obj
  }
  
  async GET(options) {
    let apiString = this.getAPIString()
    let query = this.getURLQuery()
    let contentType = options && options.headers && new Headers(options.headers).get("content-type")
  

    if (contentType ==  'text/html' || 
        query.thumbs || query.list || query.index) {
      let mediacontent = await this.plex(apiString)
      let html
      if (query.list) {
        let children = _.sortBy(this.plexChildren(mediacontent), ea => ea.getAttribute("title"))
        html = <html><ul>{...(children.map(ea => 
          <li>{ea.getAttribute("title")}</li>
        ))}</ul></html>
      } else if (query.thumbs) {
        let children = _.sortBy(this.plexChildren(mediacontent), ea => ea.getAttribute("title"))
        // #TODO we should do this only if we have a thumb        
        html = <html><div style="">{...(children.map(ea => {
              var img = <img style="" width="100px"></img>
              img.src = lively.swxURL("plex://" + ea.getAttribute("thumb"))
              img.title = ea.getAttribute("title")
              var a = <a style="">{img}<br />{ea.getAttribute("title")}</a>
              a.href = lively.swxURL("plex://" + ea.getAttribute("key"))
              var div = <div style="font-size:8pt;margin:10px;vertical-align: text-top; display:inline-block; width:100px; overflow: hidden">{a}<br />{ea.getAttribute("year")}</div>
              return div
            }
        ))}</div></html>
      } else { // default html rendering
        let table = await lively.create("lively-table")
        try {
          table.setFromJSO(this.plexToJSON(mediacontent).children)
        } finally {
          table.remove()
        }
        html = table        
      }
        
      return new Response(html.outerHTML, {
        status: 200,
        headers: {
          "content-type": "text/html" 
        }
      })
    }
    
    if (contentType ==  'application/json') {
      let mediacontent = await this.plex(apiString)
      // ok, we parse, then serialize, then pase again... can we avoid this?
      return new Response(JSON.stringify(this.plexToJSON(mediacontent)), {status: 200})
    }

    let resp = await this.plexBlob(apiString)
    return new Response(resp) // {status: 200}   
  }

  async plex(apiString) {
    var token = await this.plexToken()
    var text = await fetch("http://127.0.0.1:32400" + apiString + "?X-Plex-Token=" + token).then(r => r.text())
    return new DOMParser().parseFromString(text, "text/xml").childNodes[0];
  }
  
  async plexBlob(apiString) {
    var token = await this.plexToken()
    return fetch("http://127.0.0.1:32400" + apiString + "?X-Plex-Token=" + token).then(r => r.blob())
  }
  
  optionsFromPlex(xml, url) {
    // single vs. collections... how should we do this?
    if (xml.getAttribute && xml.getAttribute("size") == 1 && xml.childNodes[0].tagName !== "directory") { 
      xml = Array.from(xml.childNodes).filter(ea => ea.getAttribute)[0]
      lively.notify("take " + xml.childNodes)
    }
    return {
      name: xml.getAttribute("key") || xml.getAttribute("title") || xml.getAttribute("title1") || xml.tagName ,
      title: xml.getAttribute("title") || xml.getAttribute("title1"),
      parent: url.replace(/\/[^/]+\/?$/,""),
      "index-available": true,
      contents: _.sortBy(Array.from(xml.childNodes)
          .filter(ea => ea.getAttribute && ea.getAttribute("key"))
          .map(ea => {
            var obj = {
              name: ea.getAttribute("key"),
              title: ea.getAttribute("title") || ea.getAttribute("title1"),
              contents: [],
              parent: url,
              type: ea.tagName == "Directory" ? "directory" : "file"
            }
            if (obj.name.match(/^\//)) {
              obj.type = "link" // symlinks, cross refs... etc
              obj.href = this.scheme + ":/" + obj.name
            }
            return obj
          }), 
          ea => ea.title),
      type: "file"
    }
  }
  
  getAPIString() {
    var urlObj = new URL(this.url)
    return urlObj.pathname.replace(/^\/\//,"/")
  }

  getURLQuery() {
    var urlObj = new URL(this.url)
    var query =  parseQuery(urlObj.search)
    Object.keys(query).forEach(ea => {
      if (query[ea] == "") query[ea] = true;
    })
    return query
  }

  async OPTIONS() {
    var apiString = this.getAPIString()
    var mediacontent = await this.plex(apiString)
    var result = await this.optionsFromPlex(mediacontent, this.url)
    return new Response(JSON.stringify(result), {status: 200})
  }
}

PolymorphicIdentifier.register(PlexScheme)