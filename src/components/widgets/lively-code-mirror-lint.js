import { validator } from "src/external/eslint/eslint-lint.js"

CodeMirror.registerHelper("lint", "markdown", function(text, options) {
  var found = [];

  function newlines(str) {
    return str.split("\n").length;
  }

  function processJS(text, options, found) {
    
    var blocks = text.split(/(?<=\<script[^>]*?>)|(?=\<\/script>)/gi);
    debugger
    let fullCode = ""
    let offsets = [{line: -1, offset: 0}]
     
    for (var j = 1; j < blocks.length; j += 2) {
      var offset = newlines(blocks.slice(0, j).join());
      let content = blocks[j]
      offsets.push({line: newlines(fullCode), offset: offset})
      fullCode += content
    }
    var jsFound = validator(fullCode, options)

    // we want to search from behind
    offsets.reverse()
     
    for (let message of jsFound) {
      let offset = offsets.find(ea => (ea.line) <= message.from.line)
      
      message.from.line += offset.offset - offset.line
      message.to.line += offset.offset - offset.line   
    }
    found.push(...jsFound)
  }
  processJS(text, {}, found);
  return found;
});
