var fs = require('fs');
var babel = require('babel');
var helpers = require('babel-helpers');
var t = babel.types;

// ES Module helpers based on https://github.com/babel/babel/blob/master/packages/babel-runtime/scripts/build-dist.js
helpers.list.forEach(function(helperName) {
  var tree = t.program([
    t.exportDefaultDeclaration(helpers.get(helperName))
  ]);
  
  fs.writeFileSync('../babel-helpers/' + helperName + '.js', babel.transformFromAst(tree).code);
});
