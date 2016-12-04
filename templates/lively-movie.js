'use strict';

import Morph from './Morph.js';

export default class LivelyMovie extends Morph {

  initialize() {
    var url = this.getAttribute("src");
    if (url) {
      this.filepath = decodeURIComponent(url.replace(this.baseURL(),""))
      var filename = this.filepath.replace(/.*\//,"") 
      var title = filename.replace(/\[.*$/,"")
      var m = filename.match(/\[([0-9][0-9][0-9][0-9])\]/)
      var year = m && m[1]
      this.get("#title").textContent  = title
      this.get("#year").textContent  = "(" + year + ")"
    }
    lively.html.registerButtons(this);
  }

  baseURL() {
    return lively4url.replace(/[^/]*$/,"")
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
