var lunr = require("lunr");
// var lunr = require("elasticlunr");
var fs = require("fs");
var path = require("path");
var jsTokens = require("js-tokens")

if (process.argv.length < 3) {
  console.log("too few arguments");
  return;
}

var rootFolder = process.argv[2];
var idxFileName = "index.l4idx";

var lunrIdx;
// try {
//   fs.statSync(path.join(rootFolder, idxFileName));
//   // load the index
//   console.log("load saved index file");
// } catch (e) {
  // index file does not exist
  // create the index
  lunrIdx = lunr(function() {
    this.field("filename");
    this.field("content");

    this.ref("path");
  });
// }

var jsTokenizer = function (obj) {
  if (!arguments.length || obj == null || obj == undefined) return []
  if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

  return obj.toString().trim().toLowerCase().match(jsTokens);
}

// register tokenizer function to allow index serialization
lunr.tokenizer.registerFunction(jsTokenizer, "jsTokenizer");

// js tokenizer
lunrIdx.tokenizer(jsTokenizer);

// just index js-files for now
var jsFiles = fs.readdirSync(rootFolder).filter(function(file) {
  return file.slice(-3) === ".js";
});

jsFiles.forEach(function(file) {
  var filepath = path.join(rootFolder, file);
  var content = fs.readFileSync(filepath, 'utf8');

  lunrIdx.add({
    path: filepath,
    filename: file,
    content: content
  });
});


fs.writeFileSync(path.join(rootFolder, idxFileName), JSON.stringify(lunrIdx.toJSON()));
