import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

import FileIndex from "src/client/fileindex.js"

import _ from 'src/external/lodash/lodash.js'
/*MD 
# Microsoft Academic Search 
MD*/

/*MD 
<style>* {background-color:lightgray}</style>

### Example:  

```javascript{.example}
  import {MicrosoftAcademicEntities} from "src/client/protocols/academic-scheme.js"
  MicrosoftAcademicEntities.schemas()
``` 

### Microsoft Academic Raw Query:

```javascript{.example}
  fetch("https://academic.microsoft.com/api/search", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          query: "", 
          queryExpression: "Composite(AA.AuN='jens lincke')", 
          filters: [], 
          orderBy: 0, 
          skip: 0,
          sortAscending: true, 
          take: 10})
        }).then(r => r.json())
```


### And with our Scheme

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/json"
  }
}).then(r => r.json())
```




MD*/


import MarkdownIt from "src/external/markdown-it.js"


export class MicrosoftAcademicEntities {
  
  static get baseURL() {
    return "https://raw.githubusercontent.com/MicrosoftDocs/microsoft-academic-services/live/academic-services/project-academic-knowledge/"

  } 
  
  static async generateSchema(entityName) {
    var md = new MarkdownIt();  
    var content  = await fetch(this.baseURL + "reference-" + entityName+"-entity-attributes.md").then(r => r.text())
    var html= md.render(content);
    var div = <div></div>
    div.innerHTML = html
    var tbody = div.querySelector("tbody")
    return tbody ? Array.from(tbody.querySelectorAll("tr")
      .map(ea => Array.from(ea.querySelectorAll("td").map(td => td.textContent)))
      .map(ea => ({name: ea[0], description: ea[1], type: ea[2], operations: ea[3]}))) : []
  }

  static async allSchemas() {
    var all = {}
    for (var ea of ["affiliation","author","conference-instance","conference-series","field-of-study","journal","paper"]) {
      var list = await this.generateSchema(ea)
      var obj = {}
      for(var item of list) {
        obj[item.name] = item
      }

      all[ea] = obj 
    }    
    return all
  }
  
  static async schemas() {
    // window.lively4academicSchemas = null
    if (!window.lively4academicSchemas) {
       window.lively4academicSchemas = await this.allSchemas()
    }
    return window.lively4academicSchemas  
  }
  
}



export default class AcademicScheme extends Scheme {
  
  get scheme() {
    return "academic"
  }
  
  resolve() {
    return true
  }  
  
 
  
  response(content, contentType="text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType,
      },
      status: 200,
    })
  }
  async rawQuery(queryString) {
    return await fetch("https://academic.microsoft.com/api/search", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          query: queryString, 
          queryExpression: "", 
          filters: [], 
          orderBy: 0, 
          skip: 0,
          sortAscending: true, 
          attributes: "dn",
          take: 1}) // feeling lucky
        }).then(r => r.json())
  }

  async paperQuery(queryString) {
    var raw = await this.rawQuery(queryString)
    var paper = raw && raw.pr && raw.pr[0] && raw.pr[0].paper 
    if (paper) {
      // does not fit entirely.... shit!
      // var schema =  (await MicrosoftAcademicEntities.schemas()).paper       
      return {
        type: "paper", 
        entity: paper,
      }
    } return {type: "none", error: "no paper found"}
  }

  
  
  async content(queryString) {
    var content = `<h2>${this.scheme}: ${queryString}</h2>`
    
    var json = this.paperQuery(queryString)
    
    content += "<pre>" +JSON.stringify(json, undefined, 2) + "</pre>"
       return content
  }
  
  async GET(options) {
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"),"")
    if (query.length < 2)  return this.response(`{"error": "query to short"}`)
    
    
    
    if (options && options.headers) { 
      var headers = new Headers(options.headers) // #Refactor we should unify options before
      if (headers.get("content-type") == "application/json") {
        var json = await this.paperQuery(query)
        return this.response(JSON.stringify(json), "application/json")        
      }
    }
    
    query = decodeURI(query)    
    var content = await this.content(query)
    
    return this.response(content)
  }

  async OPTIONS(options) {    
    var content = JSON.stringify({}, undefined, 2)
    return new Response(content, {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    })
  }
  
}

PolymorphicIdentifier.register(AcademicScheme)