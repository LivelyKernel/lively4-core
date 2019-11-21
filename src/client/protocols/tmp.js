import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'


export class TmpScheme extends Scheme {
  
  get scheme() {
    return "tmp"
  }

  tmpFiles() {
    if (!window.lively4tmpFiles) {
      window.lively4tmpFiles = new Map()
    }
    return window.lively4tmpFiles
  }
  
  
  resolve() {
    return true
  }  
  
  get path() {
    return this.url.replace(/tmp\:\/\//,"/")
  }
  
  
  async GET(options) {
    var path = this.path
    
    
    var content = this.tmpFiles().get(path)
    if (!content) {
       return new Response(path + " not found", {status: 404})
    }
    
    return new Response(content, {status: 200})
  }

  async PUT(options) {
    var path = this.path
    
    this.tmpFiles().set(path, options.body)
    return new Response("wrote " + path, {status: 200})
  }

  async DELETE(options) {
    var path = this.path
    
    this.tmpFiles().set(path, null)
    return new Response("deleted " + path, {status: 200})
  }

  
  async OPTIONS(options) {
    var path = this.path()
    var content = this.tmpFiles().get(path)
    if (!content) {
      return new Response(JSON.stringify({error: "File not found!"}), {status: 200})
    }
    return new Response(JSON.stringify({name: path}), {status: 200})
  }
  
}



PolymorphicIdentifier.register(TmpScheme)