import Paths from "src/client/paths.js"

const FETCH_TIMEOUT = 5000

export class BrokenLinkAnalysis {

  static async extractLinks(file) {
    if (!file || !file.content || file.url.includes("/src/external/") || file.url.match(/\.js$/)) {
      return [];
    }
  
    var links = new Array()
    var statusCache = new Map()
    var extractedLinks =  new Array()
    
    if (file.url.match(/\.md$/)) {
      // #BUG prevents loading in #FireFox due to invalid regexp group
      // FF RegExp version does not support lookbehinds. https://stackoverflow.com/questions/49816707/firefox-invalid-regex-group
      // #TODO Refactor

      // let patternMdFiles = /(?<=(\]:\s*)|(\]\s*\())((http(s)?:\/\/(w{3}[.])?([a-z0-9.-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,})([a-zA-Z0-9\/\.\-\_#.?=%;]*))|((([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+([a-zA-Z0-9\-_#.?=%;]+)?))/gm
      //      // /(?<=<|\[.*\]:\s*|\[.*\]\)|src\s*=\s*('|")|href\s*=\s*('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z_-]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      // extractedLinks = file.content.match(patternMdFiles)
      
      
    } else if (file.url.match(/\.(css|(x)?html)$/)) {
      
      // #TODO Refactor
      
      // let patternHtmlCssFiles = /(?<=(src\s*=\s*|href\s*=\s*|[a-zA-Z0-9\-_]+\s*\{\s*.*\s*:\s*)('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      // extractedLinks = file.content.match(patternHtmlCssFiles)
    }
    if(!extractedLinks) {
      return [];
    }
    for (const extractedLink of extractedLinks) {
      var normalizedLink = Paths.normalizePath(extractedLink, file.url)
      var status = statusCache.get(normalizedLink)
      if (!status) {
        status = await this.validateLink(normalizedLink)
        statusCache.set(normalizedLink, status)
      }
      
      let link = {
        link: extractedLink,
        location: extractedLink.includes('lively-kernel.org') ? "internal" : "external",
        url: file.url,
        status: status,
      }
      links.push(link)  
    }
    return links
  }
   
  static async validateLink(url) { 
    console.log("[fileindex] validateLink " + url)  
    try {
      var response = await  BrokenLinkAnalysis.fetch(url, { 
        method: "GET", // "GET" or "HEAD" or "OPTIONS" 
        mode: 'no-cors', 
        redirect: "follow",
        referrer: "no-referrer", // no-referrer, *client
      }, FETCH_TIMEOUT) 

      if (response.type === "basic") { // internal link
        if (response.ok) {
          return "alive"
        } else {
          return "broken"
        } 
      } else if (response.type === "opaque") { // external link
        return "alive"
      }
    } catch(e) {
      return "broken"
    } 
    return "alive" // at least nothing went wrong?
  }

  static async fetch(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => {
              reject(new Error('Fetch timeout: ' + url))
        }, timeout)
        )
    ]);
  }
}


export class ModuleDependencyAnalysis {
  
   static async resolveModuleDependencies(fileUrl, dependencies) {
    let resolvedDependencies = new Array()
    for (const dependency of dependencies) {
      let resolvedDependency = await System.resolve(dependency.url, fileUrl)
      if (!resolvedDependency) {
        resolvedDependencies.push(dependency.url)  
      } else {
        resolvedDependencies.push(resolvedDependency)
      }
    }
     
    return {
      url: fileUrl,
      dependencies: resolvedDependencies
    }
  }
}


