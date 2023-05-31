import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";

import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js"


import _ from 'src/external/lodash/lodash.js';
/*MD 
# Semantic Scholar API 

Examples: 
```
fetch("scholar://paper/search?query=literature+graph").then(r => r.json())

var fields = "externalIds,url,title,abstract,venue,year,referenceCount,citationCount,influentialCitationCount,isOpenAccess,fieldsOfStudy,s2FieldsOfStudy,authors"
fetch(`scholar://paper/649def34f8be52c8b66281af98ae884c09aef38b?fields=${fields}`).then(r => r.json())


fetch("scholar://data/paper/DOI:10.1145/2384592.2384611").then(r => r.json())

fetch("scholar://data/paper/MAG:2087784813").then(r => r.json())
```
<script>
  <div>
    <button click={() => {
     lively.openBrowser("scholar://data/paper/DOI:10.1145/2384592.2384611")     
        }}>DOI example</button>
    <button click={() => {
     lively.openBrowser("scholar://data/paper/MAG:2087784813")     
    }}>Microsoft Academic Graph example</button>
    <button click={() => {
     lively.openBrowser("scholar://browse/paper/MAG:2087784813")     
    }}>Browse example</button>
  </div>
</script>

MD*/

const semanticScholarSubscriptionKeyId = "semantic-scholar-key";


export default class SemanticScholarScheme extends Scheme {

  get scheme() {
    return "scholar";
  }

  resolve() {
    return true;
  }

  static async setSubscriptionKey(key) {
      return focalStorage.setItem(semanticScholarSubscriptionKeyId, key);
  }
  
  static async getSubscriptionKey() {
    var key = await focalStorage.getItem(semanticScholarSubscriptionKeyId);
    return key
  }
  
  static async ensureSubscriptionKey() {
    var key = await this.getSubscriptionKey()
    if (!key) {
      key = await lively.prompt(`Enter your Semantic Scholar key`, "");
      await this.setSubscriptionKey(key);
    }
    return key
  }

  response(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 200
    });
  }

  notfound(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 303
    });
  }


  get baseURL() {
    return "https://api.semanticscholar.org/graph/v1/"
  }
  
  
  async GET(options) {
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    if (mode === "browse") {
      if (query.match(/author\/search\?query=/)) {
        let search = decodeURIComponent(query.replace(/.*\?query=/,""))
        return this.response(`<literature-paper authorsearch="${search}"><literature-paper>`);
      } else if (query.match(/search\?query=/)) {
        let search = decodeURIComponent(query.replace(/.*\?query=/,""))
        return this.response(`<literature-paper search="${search}"><literature-paper>`);
        
      } else if (query.match("paper/")) {
        let id = query.replace(/.*\?query=/,"").replace(/paper\//,"")
        return this.response(`<literature-paper scholarid="${id}"><literature-paper>`);
        
      } else if (query.match("author/")) {
        var authorId = query.replace(/.*author\//,"")
        return this.response(`<literature-paper authorid="${authorId}"><literature-paper>`);
      } else {
        return this.response(`query not supported: ` + query);
      }
      
      
    }
  
    var url = this.baseURL + query
    
    var key = await SemanticScholarScheme.ensureSubscriptionKey() // maybe only get... ?
    var headers = new Headers({})
    if (key) {
      headers.set("x-api-key", key)
    }
    
    var content = await fetch(url, {
      method: "GET",
      headers: headers
    }).then(r => r.text())
   
    return this.response(content);
  }
  
  /*MD ## Example

```javascript {.snippet}
fetch("scholar://data/paper/batch?fields=referenceCount,citationCount,title", {
  method: "POST",
  body: JSON.stringify({"ids": ["649def34f8be52c8b66281af98ae884c09aef38b", "ARXIV:2106.15928"]})
}).then(r => r.text())  
  
```
  
  
  MD*/
  async POST(options) {
    // #TODO get rid of duplication with GET
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
  
    var url = this.baseURL + query
    
    var key = await SemanticScholarScheme.ensureSubscriptionKey() // maybe only get... ?
    var headers = new Headers({})
    if (key) {
      headers.set("x-api-key", key)
    }
    
    var content = await fetch(url, {
      method: "POST",
      headers: headers,
      body: options.body
    }).then(r => r.text())
   
    return this.response(content);
  }


  async OPTIONS(options) {
    var content = JSON.stringify({}, undefined, 2);
    return new Response(content, {
      headers: {
        "content-type": "application/json"
      },
      status: 200
    });
  }

}

PolymorphicIdentifier.register(SemanticScholarScheme);

// import Tracing from "src/client/tracing.js"
// Tracing.traceClass(Paper)
