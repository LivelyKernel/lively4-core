import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";

import {AlexPaper, Author, Paper} from "src/client/literature.js"

import Preferences from 'src/client/preferences.js';


import Literature from 'src/client/literature.js'


import _ from 'src/external/lodash/lodash.js';
/*MD 
# Alex Scholar API 


MD*/``


export default class OpenAlexScheme extends Scheme {
  static requestQueue = []
  static isProcessingQueue = false


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
  
  async getEmailConfig() {
    // Preferences.set('OpenAlexEmail', 'foo@bar')
    return await Preferences.get('OpenAlexEmail', 'none')
  }
  
  async processRequestQueue() {
    if (OpenAlexScheme.isProcessingQueue) return
    OpenAlexScheme.isProcessingQueue = true
    
    while (OpenAlexScheme.requestQueue.length > 0) {
      const { url, options, resolve, reject } = OpenAlexScheme.requestQueue[0]
      try {
        const result = await this._makeRequest(url, options)
        resolve(result)
      } catch (error) {
        reject(error)
      }
      OpenAlexScheme.requestQueue.shift()
    }
    
    OpenAlexScheme.isProcessingQueue = false
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      OpenAlexScheme.requestQueue.push({ url, options, resolve, reject })
      this.processRequestQueue()
    })
  }

  async _makeRequest(url, options = {}) {
    const email = await this.getEmailConfig()
    const headers = new Headers(options.headers || {})
    if (email && email !== 'none') {
      headers.set('User-Agent', `mailto:${email}`)
    }
    
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // Start with 1 second delay
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        })
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return await response.text()
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) throw error
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)))
      }
    }
    throw new Error('Maximum retries exceeded')
  }

  async GET(options) {
    var m = this.url.match(new RegExp(this.scheme + "\:\/\/([^/]*)/(.*)"))
    var mode = m[1]
    var query = m[2];
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    if (mode === "browse") {
      if (query.match(/^W.*/)) {
        let id = query.replace(/.*\//,"")
        return this.response(`<literature-paper alexid="${id}"></literature-paper>`);
      }
    }
    var url = this.baseURL + query
    
    if (mode === "data" && query.match(/^W[0-9]+/)) {
      let id = query;
      let work = await Literature.alexdb.works.get("https://openalex.org/" + id)
      if (!work) {
        // fetch actual content and update cache in indexdb
        try {
          let content = await this.makeRequest(url)
          work = JSON.parse(content)
          await Literature.alexdb.works.put(work)
          return this.response(JSON.stringify(work, undefined, 2))
        } catch(e) {
          return this.notfound(e.message)
        }
      }
      return this.response(JSON.stringify(work, undefined, 2));
    }
     
    try {
      var content = await this.makeRequest(url)
   
      if (mode === "browse") {
        var json = JSON.parse(content)
        if (json.results) {
          content = ""
          for(var entity of json.results) {
            let paper = new AlexPaper(entity)
            content += await paper.toShortDataHTML();
          }   
        } else {
          content = "<pre>" + JSON.stringify(json, undefined, 2) +"</pre>"  
        }
      }
      
      return this.response(content);
    } catch (error) {
      return this.response(`{"error": "${error.message}"}`, "application/json");
    }
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
