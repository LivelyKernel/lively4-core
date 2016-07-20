'use strict'

var lunr = require("lunr");
var slash = require("slash");
var path = require("path");
var fs = require("fs");
var jsTokens = require("js-tokens");
import * as cp from "./lunr-node-content-provider.js";
import SearchWorker from "./lunr-search-worker.js";

class NodeSearchWorker extends SearchWorker {

    constructor() {
      super();
      process.on("message", this.messageHandler.bind(this));
      this.lunr = lunr;
      this.cp = cp;
      this.jsTokens = jsTokens;
      this.tokenizer.jsTokens = jsTokens;
    }

    send(message) {
      process.send(message);
    }

    exit() {
      process.exit();
    }

    log(string) {
      // if the string doesnt end with \r append \n
      string += string.slice(-1) !== "\r" ? "\n" : "";
      process.stdout.write(string);
    }

    remove(_relPath) {
      var relPath = slash(path.normalize(_relPath));
      super.remove(relPath);
    }

}

let worker = new NodeSearchWorker();
