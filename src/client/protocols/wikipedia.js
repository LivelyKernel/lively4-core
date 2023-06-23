import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

// #TODO conflict with src/client/poid.js#LivelyWikipedia
export class WikipediaScheme extends Scheme {
  
  get scheme() {
    return "wikipedia"
  }
  
  resolve() {
    return true
  } 
  
  
  async getContent() {
    let urlObj = new URL(this.url)
    var entry = urlObj.pathname.replace(/^\/*/,"")
    // window.open("https://www.wikiwand.com/" + entry)
    
    this.lang = entry.split("/")[0]
    var query = entry.split("/")[1]
    
    this.mode = "html" 
    var content = await fetch(`https://${this.lang}.wikipedia.org/api/rest_v1/page/${this.mode}/${query}`).then(r => r.text())
    return content
      .replace(/rel="mw:WikiLink" href="\.\//g, `rel="mw:WikiLink" href="wikipedia://${this.lang}/`)
  }
  
  async GET(options) {

   
    var content = (await this.getContent())
    
    return new Response(content, {
      status: 200,
      headers: {
        'content-type': "text/html"
      }
    })
    // var content = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/${mode}/${query}`).then(r => r.text())
    /// return new Response(content, {status: 200})
  }

  
  async OPTIONS(options) {
    let urlObj = new URL(this.url)
    var content = await this.getContent()
    var roots = lively.html.parseHTML(content)
    
    
    var children = [
      {
        name: urlObj.pathname.replace(/.*\//,""),
        href: this.url,
        type: "file",
      }, 
    ]
    
    debugger
    var navboxes = lively.html.allQuerySelectorAll(roots, ".navbox")
    var links = lively.html.allQuerySelectorAll(navboxes, "a")
    links.forEach(ea => {
      children.push({
        name: ea.textContent,
        href: ea.getAttribute("href")
      })
    })
    
    
    return new Response(JSON.stringify({
      name: urlObj.pathname,
      parent: this.url, // I am my own parent
      type: "file",
      contents: children
    }), {status: 200})
  }
  
}



PolymorphicIdentifier.register(WikipediaScheme)