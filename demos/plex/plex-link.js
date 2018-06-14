import Morph from 'src/components/widgets/lively-morph.js';
import Strings from 'src/client/strings.js'
import _ from 'src/external/underscore.js'
import {getDeepProperty} from "utils"
import {pt} from "src/client/graphics.js"
import html from 'src/client/html.js'


export default class PlexLink extends Morph {

  async initialize() {
    html.registerAttributeObservers(this);
    this.render()
  }
  
  // #TODO generate this?
  get src() {
    return this.getAttribute("src")
  }
  set src(value) {
    return this.setAttribute("src", value)
  }

  onSrcChanged() {
    this.render()
  }

  async fetchJSON(url) {
    try {
      return fetch(url, {
        method: "GET",
        headers: {
          "content-type": "application/json"
        }
      }).then(r => r.json())
    } catch(e) {
      this.get("#title").innerHTML = "Error: " + e
      return false
    }
  }
  
  async render() {
    if (!this.src || this.src == "") return;
    lively.notify("render")
    var media = await this.fetchJSON(this.src)  
    if (!media) return
  
    // Collection -> Entity
    if (media.children && media.children.length == 1) {
      media = media.children[0]
    }  
    
    var link = this.get("#link")
    link.href = this.src
    var urlString = this.src
    
    if (media.thumb) {
      this.get("#thumb").src = lively.swxURL("plex:/" + media.thumb)
    }
    this.get("#title").innerHTML = 
            (media.title ?
              ("<b>" + media.parentTitle + "</b><br>" + media.title) :      
              ("" + media.title1 + "<br>"+ media.title2))
    
    // register the event... to be able to remove it again...
    lively.addEventListener("link", link, "click", evt => {
        // #TODO make this bevior persistent?
        evt.preventDefault();
        evt.stopPropagation();
        lively.openBrowser(urlString, false, "xxx"); // no navigation #TODO refactor API
        return true;
      })
  }
  

  livelyInspect(contentNode, inspector) {
     if (this.media) {
      contentNode.appendChild(inspector.display(this.media, false, "#media", this));
    }
  }
  
  async livelyExample() {
    // plex://library/sections/2/genre/48422/
    // plex://library/sections/3/year/2000/
    // plex://library/sections/2/decade/2000/
    // this.setAttribute("src", "plex://library/sections/3/decade/2000/")
    this.setAttribute("src", "plex://library/metadata/5731/")
    
  }
  
  
  
}