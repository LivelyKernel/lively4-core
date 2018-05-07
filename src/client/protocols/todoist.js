import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

var lastTokenPromted

var todoistData

export class TodoistScheme extends Scheme {
  
  get scheme() {
    return "todoist"
  }
  
  async todoistToken() {
    var token = await focalStorage.getItem("todoist-token")
    if(!token && (!lastTokenPromted || ((Date.now() - lastTokenPromted) > 1000 * 5))) { 
      // don't ask again for 5 seconds...
      lastTokenPromted = Date.now()
      token = await lively.prompt("todoist token required: ")
      if (token) {
        focalStorage.setItem("todoist-token", token)
      }
    }
    return token
  }

  resolve() {
    return true
  }  
 
  async fetchData() {
    return await fetch(`https://todoist.com/api/v7/sync`+
      `?token=${await this.todoistToken()}`+
      `&sync_token=*`+
      `&resource_types=${encodeURI(JSON.stringify(["all"]))}`, {  
          method: 'POST',  
      }).then(r => r.json())
  }

  async getData() {
    if (!todoistData)  todoistData = await this.fetchData()
    return todoistData
  }
  
  async GET(options) {
   let data = await this.getData()
    let urlObj = new URL(this.url)
    let m = urlObj.pathname.match(/^\/*([^/]+)\/?([^/]+)?$/)
    let type = m && m[1]
    let id = m && m[2]
    lively.notify("path" +urlObj.pathname+"type: " + type + " id:" + id)
    let result;
    if (!type ) {
      result =  data   
    } else {
      let list = data[type]
      if (!id) {
       result =  list
      } else {
       let item = list.find(ea => ea.id == id)
       result =  item
      }
    }
    return new Response(JSON.stringify(result), {status: 200})
  }

  itemToFile(type, item) {
    return {
      name: "" + item.id, 
      title: item.name || 
        (item.content ? ("" + item.content).slice(0, 30) : undefined),
      parent: this.scheme + "://" + type + "/",
      type: "file", 
    } 
  }
  
  async OPTIONS() {
    let data = await this.getData()
    let urlObj = new URL(this.url)
    let m = urlObj.pathname.match(/^\/*([^/]+)\/?([^/]+)?$/)
    let type = m && m[1]
    let id = m && m[2]
    lively.notify("path" +urlObj.pathname+"type: " + type + " id:" + id)
    let result;
    if (!type ) {
      result =  {
        name: "root", 
        type: "directory", 
        parent: this.scheme + "://",
        contents: Object.keys(data).map(ea => ({
          name: ea,
          type: data[ea].map ? "directory" : "file"
        }))
      }      
    } else {
      let list = data[type]
      if (!id) {
       result =  {
          name: type, 
          type: list.map ? "directory" : "file", 
          parent: this.scheme + "://",
          contents:  list.map ? list.map(ea => this.itemToFile(type, ea)) : undefined
       } 
      } else {
       let item = list.find(ea => ea.id == id)
       result =  this.itemToFile(type, item)
      }
    }
    return new Response(JSON.stringify(result), {status: 200})
  }
}



PolymorphicIdentifier.register(TodoistScheme)