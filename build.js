/*global require*/
/*
fswatch -0 -r . | xargs -0 -I{} bash -c \
  "[[ \"{}\" =~ .js$ ]] && [[ ! \"{}\" =~ .bundle. ]] && node build.js;"
*/

var uglify      = require("uglify-js")
var babel       = require("babel-core");
var fs          = require("fs");
var exec        = require("child_process").exec;
var fun         = require("./index").fun;
var arr         = require("./index").arr;
var target      = "./dist/lively.lang.dev.js";
var targetES5   = target.replace(/\.dev\.js$/,".es5.js");
var targetMin   = target.replace(/\.dev\.js$/,".min.js");
var packageJson = JSON.parse(fs.readFileSync('./package.json'));

fun.composeAsync(
  log("1. Generating doc"),
  n => exec("npm run doc", (code, out, err) => n(code ? out+err : null)),
  log("2. Cleanup build files"),
  n => fs.unlink(target, (err) => n()),
  n => fs.unlink(targetES5, (err) => n()),
  n => fs.unlink(targetMin, (err) => n()),
  // n => fs.mkdir("dist", (err) => n()),
  log("3. write " + target),
  n => arr.mapAsync(packageJson.libFiles, (f, _, n) => fs.readFile(f, n), n),
  (contents, n) => n(null, contents.map(String).join("\n\n")),
  (code, n) => fs.writeFile(target, code, err => n(err, code)),
  log("4. write " + targetES5),
  (code, n) => fs.writeFile(targetES5, babel.transform(code).code, n),
  log("5. minification"),
  n => fs.writeFile(targetMin, uglify.minify(targetES5).code, n)
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
