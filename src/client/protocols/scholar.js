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

```
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


  async GET(options) {
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    if (mode === "browse") {
      if (query.match("search\?query=")) {
        let search = query.replace(/.*\?query=/,"")
        return this.response(`<literature-paper search="${search}"><literature-paper>`);
        
      } else if (query.match("paper/")) {
        let search = query.replace(/.*\?query=/,"")
        return this.response(`<literature-paper search="${search}"><literature-paper>`);
        
      } else if (query.match("author/")) {
        var authorId = query.replace(/.*author\//,"")
        return this.response(`<literature-paper authorid="${authorId}"><literature-paper>`);
      } else {
        return this.response(`query not supported: ` + query);
      }
      
      
    }
  
    var url = "https://api.semanticscholar.org/graph/v1/" + query
    
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
