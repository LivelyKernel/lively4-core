'use strict';

import SearchWorker from '../shared/lunr-search-worker.js';
import {jsTokens} from '../external/js-tokens.js';
import * as cp from './lunr-dropbox-content-provider.js';
// import * as utils from "./search-utils.js";

export class ES6SearchWorker extends SearchWorker {

    constructor(msgId, options) {
      super();
      onmessage = this.messageHandlerWrapper.bind(this);
      // utils.ensureLunr();
      // this.lunr = window.lunr;
      this.lunr = lunr;
      this.cp = cp;
      this.tokenizer.jsTokens = jsTokens;

      // if a msgId was provided the init message was received before ES6Worker was instantiated
      if (msgId) {
        this.init(msgId, options);
      }
    }

    messageHandlerWrapper(message) {
      // the sent data is contained in the data object of the message for web workers
      this.messageHandler(message.data);
    }

    send(message) {
      postMessage(message);
    }

    exit() {
      close();
    }

    log(string) {
      console.log(string);
    }
}
