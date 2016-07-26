/*global require*/
/*
fswatch -0 -r . | xargs -0 -I{} bash -c \
  "[[ \"{}\" =~ .js$ ]] && [[ ! \"{}\" =~ .bundle. ]] && node build.js;"
*/

var uglify      = require("uglify-js")
var fs          = require("fs");
var exec        = require("child_process").exec;
var fun         = require("./index").fun;
var arr         = require("./index").arr;
var ast         = require("lively.ast");
var target      = "./dist/lively.lang.dev.js";
var targetMin   = target.replace(/\.dev\.js$/,".min.js");
var packageJson = JSON.parse(fs.readFileSync('./package.json'));

var preamble = `
;(function() {
  var GLOBAL = typeof window !== "undefined" ? window :
    typeof global!=="undefined" ? global :
      typeof self!=="undefined" ? self : this;
  var lively = GLOBAL.lively = GLOBAL.lively || (GLOBAL.lively = {});
`;
var postscript = `\n})();`

console.log("--------------");
fun.composeAsync(
  // log("1. Generating doc"),
  // n => exec("npm run doc", (code, out, err) => n(code ? out+err : null)),
  log("2. Cleanup build files"),
  n => fs.unlink(target, (err) => n()),
  n => fs.unlink(targetMin, (err) => n()),
  // n => fs.mkdir("dist", (err) => n()),
  log("3. write " + target),
  n => arr.mapAsync(packageJson.libFiles, (f, _, n) => fs.readFile(f, n), n),
  (contents, n) => n(null, contents.map(String)),
  (contents, n) => n(null, preamble + contents[0] + contents.slice(1).map(ensureExport).join("\n\n") + postscript),
  (code, n) => fs.writeFile(target, code, err => n(err)),
  log("4. minification"),
  n => fs.writeFile(targetMin, uglify.minify(target).code, n)
)(err => {
  err ? console.error(err) : console.log("bundled to %s!", target)
});

function log(msg) {
  return function() {
    console.log(msg);
    var args = arr.from(arguments),
        n = args.pop();
    n.apply(this, [null].concat(args));
  }
}

function ensureExport(source) {
  // will remove the require('./base') thing
  var parsed = ast.parse(source)
  var replacement = ast.parse('typeof lively !== "undefined" && lively.lang ? lively.lang : {}').body[0].expression
  var call = parsed.body.find(n => n.expression && n.expression.type === "CallExpression")
  call.expression["arguments"] = [replacement];
  return ast.stringify(parsed);
}
