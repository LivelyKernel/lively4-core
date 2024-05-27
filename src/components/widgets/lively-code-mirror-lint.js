import { validator } from "src/external/eslint/eslint-lint.js"


CodeMirror.registerHelper("lint", "markdown", function(text, options) {
  var found = [];

  function newlines(str) {
    return str.split("\n").length;
  }

  function processJS(text, options, found) {
    var blocks = text.split(/<script[\s\S]*?>|<\/script>/gi);

    for (var j = 1; j < blocks.length; j += 2) {
      var offset = newlines(blocks.slice(0, j).join());
      let content = blocks[j]
      var jsFound = validator(content, options)
      for (let message of jsFound) {
        message.from.line += offset - 1
        message.to.line += offset - 1
      }
      found.push(...jsFound)
    }
  }
  processJS(text, {}, found);
  return found;
});
