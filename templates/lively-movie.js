'use strict';

import Morph from './Morph.js';

export default class LivelyMovie extends Morph {

  initialize() {
    var url = this.getAttribute("src");
    if (url) {
      this.filepath = decodeURIComponent(url.replace(this.baseURL(),""))
      this.filename = this.filepath.replace(/.*\//,"") 
      this.title = this.filename.replace(/ *\[.*$/,"")
      var m = this.filename.match(/\[([0-9][0-9][0-9][0-9])\]/)
      this.year = m && m[1]
      this.get("#title").textContent  = this.title
      this.get("#year").textContent  = this.year
      this.get("#format").textContent = this.filename
      this.updateInfo()
    }
    lively.html.registerButtons(this);
  }

  baseURL() {
    return lively4url.replace(/[^/]*$/,"")
  }

  async updateInfo() {
    // #TODO refactor this very magic and realy variables out...
    var info = await fetch(lively4url + "/../media/Movies/_imdb_/search/" 
      + this.title + ".json").then(r => r.text()).catch(e => {
        console.log("Error loading search results: " + e)
        return undefined
      })
    if (!info) {
      this.get("#info").textContent = 'No search result for: ' + this.title
      return
    }
    try {
      var json = JSON.parse(info)
    } catch(e) {}
    if (!json) {
      this.get("#info").innerHTML = "Could not parse: <pre>" + info + "</pre>"
      return
    }
    var movie;
    if (json.title_popular) {
     movie = json.title_popular.find( ea => ea.description.match(this.year))
    } else if(json.title_exact) {
      movie = json.title_exact.find( ea => ea.description.match(this.year))
    }
    if (movie) {
      this.imdb = await fetch(lively4url + "/../media/Movies/_imdb_/titles/" 
      + movie.id + ".json").then(r => r.json()).catch(e => {
        console.log("Error loading search results: " + e)
        return undefined
      })
      this.get("#imdb").textContent = this.imdb.imdbID
      this.get("#imdb").onclick = () => {
        window.open("http://www.imdb.com/title/" + this.imdb.imdbID)
      }
      
      
      this.get("#youtube").onclick = () => {
        window.open("http://www.google.com/search?q="+encodeURIComponent(this.imdb.Title) + "+youtube&btnI" )
      }
      this.get("#wikipedia").onclick = () => {
        window.open("http://www.google.com/search?q="+encodeURIComponent(this.imdb.Title + " " + this.imdb.Year) + "+wikipedia&btnI" )
      }
      
      this.get("#title").textContent  = this.imdb.Title
      this.get("#year").textContent  = this.imdb.Year
      
      this.get("#imdbRating").textContent = this.imdb.imdbRating;
      this.get("#imdbVotes").textContent = this.imdb.imdbVotes;
      this.get("#metascore").textContent = this.imdb.Metascore;

      this.get("#genre").textContent = this.imdb.Genre;       
      this.get("#director").textContent = this.imdb.Director;   

      this.get("#writer").textContent = this.imdb.Writer;   
      this.get("#actors").textContent = this.imdb.Actors;       
      this.get("#plot").textContent = this.imdb.Plot;       
      
      this.get("#poster").setAttribute("src",  this.imdb.Poster)
      this.get("#info").innerHTML = ""
    } else {
      this.get("#info").innerHTML = "<b>No fitting movie found!</b><pre>" 
        + info + "</pre"
    }
      
  }

  onPlayButton() {
    lively.notify("play " + this.filepath)
    fetch(this.baseURL() +"_meta/play", {
      headers: {
        filepath: this.filepath
      }
    })
  }
}
