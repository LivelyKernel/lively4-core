## 2019-07-22 Babel AST Nodes

```javascript
self.names =  names = [
  'RegExpLiteral',
  'NullLiteral',
  'StringLiteral',
  'BooleanLiteral',
  'EmptyStatement',
  'DebuggerStatement',
  'WithStatement',
  'LabeledStatement',
  'BreakStatement',
  'ContinueStatement',
  'IfStatement',
  'SwitchStatement',
  'SwitchCase',
  'ThrowStatement',
  'TryStatement',
  'CatchClause',
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'FunctionDeclaration',
  'Decorator',
  'Directive',
  'DirectiveLiteral',
  'Super',
  'Import',
  'ThisExpression',
  'YieldExpression',
  'AwaitExpression',
  'ArrayExpression',
  'ObjectExpression',
  'ObjectMember',
  'ObjectProperty',
  'ObjectMethod',
  'FunctionExpression',
  'UnaryExpression',
  'UnaryOperator',
  'UpdateExpression',
  'UpdateOperator',
  'LogicalExpression',
  'SpreadElement',
  'BindExpression',
  'ConditionalExpression',
  'NewExpression',
  'SequenceExpression',
  'DoExpression',
  'TemplateLiteral',
  'TaggedTemplateExpression',
  'TemplateElement',
  'ObjectPattern',
  'ArrayPattern',
  'RestElement',
  'AssignmentPattern',
  'ClassBody',
  'ClassMethod',
  'ClassPrivateMethod',
  'ClassProperty',
  'ClassPrivateProperty',
  'ClassDeclaration',
  'ClassExpression',
  'MetaProperty',
  'ModuleDeclaration',
  'ModuleSpecifier',
  'ImportDeclaration',
  'ImportSpecifier',
  'ImportDefaultSpecifier',
  'ImportNamespaceSpecifier',
  'ExportNamedDeclaration',
  'ExportSpecifier',
  'ExportDefaultDeclaration',
  'ExportAllDeclaration',
]

var FullNames = names.map(n => 'AstNode' + n)
var componentNames = FullNames.map(n => n.kebabCase())

import Strings from "src/client/strings.js"

async function copyTemplate(dir, component, type) {
  var filename = component + "." + type
  var classname = component.split(/-/).map(ea => Strings.toUpperCaseFirst(ea)).join("")
  var url = dir  + "/" + filename
  if (await lively.files.existFile(url)) {
    lively.notify("Could not create " + url + ", beacuse it already exists!")
  } else {
    var templatejs_src = await lively.files.loadFile(lively4url + "/src/client/pen-editor/components/template." + type)
    templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_CLASS/g, classname)
    templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_ID/g, component)
    await lively.files.saveFile(url, templatejs_src)
  }
}

componentNames.map(async name => {
  const dir = 'https://lively-kernel.org/lively4/aexpr/src/client/pen-editor/components';
  await copyTemplate(dir, name, 'js');
  await copyTemplate(dir, name, 'html');
})
```
