'use strict';

import focalStorage from './../external/focalStorage.js'
import generateUuid from './uuid.js'

import sourcemap from 'https://raw.githubusercontent.com/mozilla/source-map/master/dist/source-map.min.js'

export default class Files {
  static parseSourceReference(ref) {
    if(ref.match("!")) {
      var url = ref.replace(/\!.*/,"")
      var args = ref.replace(/.*\!/,"").split(/:/)
    } else {
      var m = ref.match(/(.*):([0-9]+):([0-9]+)$/)
      args = [m[2], m[3]]
      url = m[1]
    }
    
    var lineAndColumn
    if (args[0] == "transpiled") {
      // hide transpilation in display and links
      var moduleData = System["@@registerRegistry"][url]
      if (moduleData) {
      var map = moduleData.metadata.load.sourceMap
      var smc =  new sourcemap.SourceMapConsumer(map)
      lineAndColumn = smc.originalPositionFor({
          line: Number(args[1]),
          column: Number(args[2])
        })
      } else {
        lineAndColumn = {line: args[1], column: args[2]}
      }
    } else {
      lineAndColumn = {line: args[0], column: args[1]}
    }
    lineAndColumn.url = url
    lineAndColumn.toString = function() {
        return "" + this.url.replace(lively4url, "") + ":" + this.line + ":" + this.column
    }
    return lineAndColumn
  }
  
  
  static fetchChunks(fetchPromise, eachChunkCB, doneCB) {
    fetchPromise.then(function(response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var all = "";
        (function read() {
          reader.read().then(function(result) {
            var text = decoder.decode(result.value || new Uint8Array, {
              stream: !result.done
            });
            all += text
            if (eachChunkCB) eachChunkCB(text, result)
            if (result.done) {
              if (doneCB) doneCB(all, result)
            } else {
              read() // fetch next chunk
            }
          })
        })()
      })
  }

  // #depricated, use fetch directly
  static async loadFile(url, version) {
    return fetch(url, {
      headers: {
        fileversion: version
      }
    }).then(function (response) {
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  // #depricated
  static async saveFile(url, data){
    var urlString = url.toString();
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      return fetch(urlString, {method: 'PUT', body: data});
    }
  }
  
  static async statFile(urlString){
  	return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.text())
  }

  static async existFile(urlString){
  	return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.status == 200)
  }



}