import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"

export class PlexScheme extends Scheme {
  
  get scheme() {
    return "plex"
  }
  
  async plexToken() {
    return focalStorage.getItem("plex-token")
  }

  resolve() {
    return true
  }  

  indexFilename() {
    return ".index.html"
  }
  
  plexChildren(mediacontent) {
    return Array.from(mediacontent.childNodes).filter(ea => ea.getAttribute)
  }
  
  plexToJSON(mediacontent) {
    
      let obj = {}
      mediacontent.getAttributeNames().forEach(prop => {
        obj[prop] = mediacontent.getAttribute(prop)
      })
      
      this.plexChildren(mediacontent).forEach(child => {
        let tag = child.getAttribute("tag")
        if (tag) {
          if (!obj[child.tagName]) obj[child.tagName] = [];
          obj[child.tagName].push(tag)
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
    if (apiString.endsWith(this.indexFilename())) {
      let mediacontent = await this.plex(apiString.replace("/" + this.indexFilename(), ""))
      var table = await lively.create("lively-table")
      table.setFromJSO(this.plexToJSON(mediacontent).children)
      let html = table
      // var children = this.plexChildren(mediacontent)
//       let html = <html><ul>{...(children.map(ea => 
//         <li>{ea.getAttribute("title")}</li>
//       ))}</ul></html>
        
      
      return new Response(html.outerHTML, {status: 200})
    }
    
    let mediacontent = await this.plex(apiString)
    if (options && options.headers && new Headers(options.headers).get("content-type") ==  'application/json') {
      // ok, we parse, then serialize, then pase again... can we avoid this?
      return new Response(JSON.stringify(this.plexToJSON(mediacontent)), {status: 200})
    }

    let html = mediacontent.outerHTML
  
    
    return new Response(html, {status: 200})
    
    // return new Response("&st;h1>Nothing found&st;/h1>", {status: 200})
  }

  async plex(apiString) {
    var token = await this.plexToken()
    var text = await fetch("http://127.0.0.1:32400" + apiString + "?X-Plex-Token=" + token).then(r => r.text())
    return new DOMParser().parseFromString(text, "text/xml").childNodes[0];
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
      contents: Array.from(xml.childNodes)
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
        }).concat([{
          name: ".index.html", // hidden index file
          parent: url,
          contents: [],
          type: "file"
        }]),
      type: "directory"
    }
  }
  
  getAPIString() {
    return this.url.replace(new RegExp("^" + this.scheme+ ":/"),"")
  }
  
  async OPTIONS() {
    var apiString = this.getAPIString().replace("/" + this.indexFilename(),"")
    var mediacontent = await this.plex(apiString)
    var result = await this.optionsFromPlex(mediacontent, this.url)
    return new Response(JSON.stringify(result), {status: 200})
  }
}

PolymorphicIdentifier.register(PlexScheme)