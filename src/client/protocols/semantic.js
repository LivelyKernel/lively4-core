import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";

import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js"


import _ from 'src/external/lodash/lodash.js';
/*MD 
# Semantic Scholar API 
MD*/

const semanticScholarSubscriptionKeyId = "microsoft-academic-key";


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
  
  // static async getSubscriptionKey() {
  //   var key = await focalStorage.getItem(semanticScholarSubscriptionKeyId);
  //   if (!key) {
  //     key = await lively.prompt(`Enter your <a href="https://msr-apis.portal.azure-api.net/developer" target="_">Project Academic Knowledge</a> key`, "");
  //     await this.setSubscriptionKey(key);
  //   }
  //   return key
  // }

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
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"), "");
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    
    var argsString = query.replace(/.*\?/,"")
    query = query.replace(/\?.*/,"") // strip arguments
   
    this.query = decodeURI(query);
    
    // adhoc url paremeter decoding...
    var args = {}
    argsString.split(/[?&]/).forEach(ea => {
      var pair = ea.split("=")
      args[pair[0]] = pair[1]
    })
    this.count = args["count"] || 10
    
    var attributes = args["attr"]; // optional
   
    options = options || {}
    var headers = new Headers(options.headers); // #Refactor we should unify options before
    
    
    var content = "NOT IMPLEMENTED YET"
   
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
