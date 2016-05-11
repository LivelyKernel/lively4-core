var lunr = require("lunr");
// var lunr = require("elasticlunr");
var fs = require("fs");
var path = require("path");
var jsTokens = require("js-tokens");
var slash = require("slash");

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
    // this.saveDocument(false);
  });
// }

var jsTokenizer = function (obj) {
  if (!arguments.length || obj == null || obj == undefined) return []
  if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

  return obj.toString().trim().toLowerCase().match(jsTokens).filter(function(token) { return token.length < 30; });
}


// register tokenizer function to allow index serialization
lunr.tokenizer.registerFunction(jsTokenizer, "jsTokenizer");
// lunr.tokenizer.setSeperator(jsRegex);
// lunr.clearStopWords();
// js tokenizer
lunrIdx.tokenizer(jsTokenizer);
// lunr.tokenizer = jsTokenizer;

function indexFilesDeep(rootDir) {
  fs.readdirSync(rootDir).forEach(function(file) {
    var stat = fs.statSync(path.join(rootDir, file));
    if (stat.isDirectory()) {
      indexFilesDeep(path.join(rootDir, file));
    } else if (stat.isFile()) {
      // just index js-files for now
      if (file.slice(-3) === ".js") {
        addFile(rootDir, file);
      }
    }
  });

}

function addFile(dir, filename) {
  var filepath = path.join(dir, filename);
  console.log("Indexing " + filepath);
  var content = fs.readFileSync(filepath, 'utf8');

  lunrIdx.add({
    path: slash(filepath.slice(rootFolder.length)),
    filename: filename,
    content: content
  });
  counter++;
}

var counter = 0;

indexFilesDeep(rootFolder);

console.log("Indexed " + counter + " files");
// debugger;
var serialized = JSON.stringify(lunrIdx.toJSON());
console.log(serialized.length);

fs.writeFileSync(path.join(rootFolder, idxFileName), serialized);
console.log("written index to " + path.join(rootFolder, idxFileName));

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
  var s = d.toString().trim();
  console.log(lunrIdx.search(s));
});
