import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";

import {Author, Paper} from "src/client/literature.js"

import Preferences from 'src/client/preferences.js';


import _ from 'src/external/lodash/lodash.js';
/*MD 
# Alex Scholar API 


MD*/``


export default class OpenAlexScheme extends Scheme {

  get scheme() {
    return "alex";
  }

  resolve() {
    return true;
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
    return "https://api.openalex.org/"
  }
  
  
  async GET(options) {
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    if (mode === "browse") {
      if (query.match(/W.*/)) {
        let id = query.replace(/.*\//,"")
        return this.response(`<literature-paper alexid="${id}"><literature-paper>`);
      }
    }
  
    
    var url = this.baseURL + query
    
    var headers = new Headers({})    
    var content = await fetch(url, {
      method: "GET",
      headers: headers
    }).then(r => r.text())
   
    if (mode === "browse") {
      var json  = JSON.parse(content)
      content = JSON.stringify(json, undefined, 2)
    }
    
    return this.response(content);
  }
  
  async POST(options) {
    // #TODO get rid of duplication with GET
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
  
    var url = this.baseURL + query
    
    
    var headers = new Headers({})
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

PolymorphicIdentifier.register(OpenAlexScheme);

// import Tracing from "src/client/tracing.js"
// Tracing.traceClass(Paper)
