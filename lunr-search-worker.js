'use strict'

function tokenizer(obj) {
  if (!arguments.length || obj == null || obj == undefined) return [];
  if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() });

  let tokens;
  if (tokenizer.mode === "js") {
    // use js regex
    tokens = obj.toString().trim().toLowerCase().match(tokenizer.jsTokens).filter(function(token) {
      return token.length < 30 && token !== "";
    });
  } else if (tokenizer.mode === "html") {
    // use simple whitespace split for now
    tokens = obj.toString().trim().toLowerCase().split(" ").filter(function(token) {
      return token.length < 30 && token !== "";
    });
  } else {
    // unknown mode, use whitespace split
    tokens = obj.toString().trim().toLowerCase().split(" ").filter(function(token) {
      return token.length < 30 && token !== "";
    });
  }

  // filter weird characters
  return tokens.map(token => {
    return token.replace(/[^\x00-\x7F]/g, "");
  });
}

tokenizer.setMode = function(mode) {
  tokenizer.mode = mode;
}

// abstract class!
export default class SearchWorker {

  constructor() {
    // lunr index object
    this.index = null;
    this.idxFileName = "index.l4idx";
    this.tokenizer = tokenizer;

    this.send({
      type: "worker-ready"
    });
  }

  messageHandler(m) {
    // if (!this.index && m.type !== "init") {
    //   this.init();
    // }

    switch (m.type) {
      case "init":
        this.init(m.msgId, m.options);
        break;
      case "checkIndexFile":
        this.checkIndexFile(m.msgId, m.options);
        break;
      case "addFile":
        this.addFile(m.idxRelPath);
        break;
      case "removeFile":
        this.removeFile(m.idxRelPath);
        break;
      case "search":
        this.search(m.query, m.msgId);
        break;
      case "stop":
        this.stop();
        break;
      default:
        this.send({
          type: "error",
          message: "Unknown message type"
        });
    }
  }


  // *** Message handlers ***

  async init(msgId, options) {
    this.options = options

    if (this.index) {
      return;
    }

    // register tokenizer function to allow index serialization
    this.lunr.tokenizer.registerFunction(tokenizer, "tokenizer");

    // check for existing index file
    try {
      let jsonData = await this.cp.loadIndexJson(this.idxFileName, this.options);
      this.log("Found existing index, load it");

      this.index = this.lunr.Index.load(jsonData);

      this.send({
        type: "init-response",
        msgId: msgId,
        message: "ready"
      });
    } catch (err) {
      // no index found
      this.send({
        type: "init-response",
        msgId: msgId,
        message: "indexing"
      });

      // setup the index
      this.index = this.lunr(function() {
        this.field("filename");
        this.field("content");

        this.ref("path");
      });

      // TODO: clear stopwords!!!

      // set the js tokenizer
      this.index.tokenizer(tokenizer);

      await this.createIndex();
      console.log("Index successfully created")
      this.send({
        type: "init-response",
        message: "ready"
      });
    }
  }

  async checkIndexFile(msgId, options) {
    let status = await this.cp.checkIndexFile(this.idxFileName, options);
    this.send({
      type: "index-status-response",
      msgId: msgId,
      message: status
    });
  }

  async createIndex() {
    let files = this.cp.FileReader(this.options);
    let indexedVersions = {};

    let counter = 0;
    while (true) {
      let file = await files.next();

      // if the iterator is exhausted an object {done: true} is returned ?! ^^
      if (file.done) {
        break;
      }
      counter++;
      this.log(`Indexing file ${counter}\r`);

      this.addDocumentToIndex(file.value);
    }

    this.saveIndexFile();
  }

  async addFile(relPath) {
    if (!this.cp.isIndexable(relPath)) {
      this.log(`[Search] Won't index ${relPath}, no indexable extension`);
      return;
    }

    var files = this.cp.FileReader(relPath, this.options);
    while (true) {
      var file = await files.next();

      // if the iterator is exhausted an object {done: true} is returned
      if (file.done) {
        break;
      }
      this.addDocumentToIndex(file.value);
    }

    this.saveIndexFile();
  }

  removeFile(relPath) {
    this.index.remove({
      path: relPath
    });

    this.saveIndexFile();
  }

  search(query, msgId) {
    var result = this.index.search(query);

    this.send({
      type: "search-response",
      msgId: msgId,
      message: result
    });
  }

  stop() {
    // this.saveIndexFile();
    this.exit();
  }


  // *** Internal methods ***

  addDocumentToIndex(doc) {
    tokenizer.setMode(doc.ext);

    this.index.remove({
      path: doc.path
    });

    this.index.add({
      path: doc.path,
      filename: doc.filename,
      content: doc.content
    });
  }

  saveIndexFile() {
    try {
      this.cp.saveIndexJson(this.index, this.idxFileName, this.options).then( () => {
        this.log("Written index " + this.idxFileName);
      });
    } catch (err) {
      this.log("Error saving index file: " + err);
    }
  }

  saveIndexedVersions(versions) {
    // subclass might want to override this
  }
}
