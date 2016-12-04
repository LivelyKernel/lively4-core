'use strict';

import Morph from './Morph.js';
import html from "src/client/html.js"


export default class LivelyMovieList extends Morph {

  initialize() {
    var src = this.getAttribute("src")
    if (src) {
      this.setURL(src)
    }
  }
  
  async getCached(url) {
    var cache = await caches.open("lively4-imdb4")
    var url = new Request(url);
    var resp = await  imdbCache.match(url)
    if(!resp) {
      var resp = await fetch(url)
      imdbCache.put(url, resp.clone())
    } 
    return resp
  }
  
  async setURL(url) {  
    
    this.setAttribute("src", url)
    var movies = await fetch(dir, {
    	method: "OPTIONS"
    }).then(r => r.json())
    
    this.get("#pane").innerHTML = ""
    var container = this.get("#pane");
    movies.contents.forEach( ea =>  {
      var li = document.createElement("li")
      var movieURL = url + encodeURIComponent(ea.name);
      li.innerHTML = "<a href='" + movieURL + "'>" + ea.name +"</a"
      li.querySelector("a").onclick = (evt) => {
        this.playMovieURL(movieURL)
        evt.stopPropagation()
        evt.preventDefault()
        return true
      }
      container.appendChild(li)
    })
  } 
    
  baseURL() {
    return lively4url.replace(/[^/]*$/,"")
  }

  playMovieURL(url) {
    var filepath = decodeURIComponent(url.toString().replace(this.baseURL(),""))
    
    fetch(this.baseURL() +"_meta/play", {
      headers: {
        filepath: filepath
      }
    })
  }

  
}
