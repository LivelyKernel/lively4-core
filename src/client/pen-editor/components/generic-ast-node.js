"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

// https://github.com/babel/babel/blob/8ee24fdfc04870dade1f7318b29bb27b59fdec79/packages/babel-types/src/definitions/core.js
// validator https://github.com/babel/babel/blob/eac4c5bc17133c2857f2c94c1a6a8643e3b547a7/scripts/generators/utils.js
// let nodeTypes = Object.keys(babel.types.ALIAS_KEYS).map(name => babel.types[name])
// nodeTypes.map(n => n.name)
// babel.buildExternalHelpers()
// babel.types.BUILDER_KEYS.IfStatement
// babel.types.NODE_FIELDS.ArrowFunctionExpression.body.validate.oneOfNodeTypes
// babel.types.NODE_FIELDS.BlockStatement.body.validate
// var y = 
//     Object.keys(babel.types.NODE_FIELDS.AssignmentExpression.operator.validate)
// babel.types.identifier('hello')
// babel.types.TYPES[0]
// var x = babel.types.NODE_FIELDS.BlockStatement.body.validate.chainOf[1]
// Object.keys(x.each.oneOfNodeTypes)
// Object.keys(y)
//((babel.types.NODE_FIELDS.BlockStatement.directives.validate).chainOf[1].each).oneOfNodeTypes[0] === 'Directive'

export default class GenericAstNode extends Morph {
  async initialize() {
    this.windowTitle = "GenericAstNode";
  }
  
  get nodeType() { return this.get('#node-type'); }
  get childList() { return this.get('#child-list'); }

  async setNode(babelASTNode) {
    this.astNode = babelASTNode
    this.nodeType.innerHTML = this.astNode.type
    const fields = babel.types.NODE_FIELDS[this.astNode.type];
    if (!fields) { return; }
    for (let [key, value] of Object.entries(fields)) {
      let childNode;
      if (!this.astNode[key] || !this.astNode[key].type) {
        if (Array.isArray(this.astNode[key])) {
          const children = this.astNode[key];
          const nodes = await Promise.all(children.map(async child => {
            const node = await (<generic-ast-node></generic-ast-node>)
            await node.setNode(child)
            return node
          }));
          childNode = <div>{...nodes}</div>
        } else {
          childNode = document.createTextNode(this.astNode[key]);
        }
      } else {
        childNode = await (<generic-ast-node></generic-ast-node>)
        await childNode.setNode(this.astNode[key])
      }
      this.childList.appendChild(<span class="kv-pair">{key} {childNode}</span>)
    }
  }
  
  /* Lively-specific API */

  livelyPreMigrate() {} // is called on the old object before the migration
  
  livelyMigrate(other) {
    this.setNode(other.astNode);
  }
  
  livelyInspect(contentNode, inspector) {}
  
  livelyPrepareSave() {}
  
  async livelyExample() {
    const syntaxPlugins = (await Promise.all([
      'babel-plugin-syntax-jsx',
      'babel-plugin-syntax-do-expressions',
      'babel-plugin-syntax-function-bind',
      'babel-plugin-syntax-async-generators'
    ]
      .map(syntaxPlugin => System.import(syntaxPlugin))))
      .map(m => m.default);

    const source = await fetch(lively4url + '/src/client/pen-editor/components/example.js').then(r => r.text());
    
    var ast = babel.transform(source, {
      babelrc: false,
      plugins: syntaxPlugins,
      presets: [],
      moduleIds: false,
      sourceMaps: true,
      compact: false,
      comments: true,
      code: true,
      ast: true,
      resolveModuleSource: undefined
    }).ast;
    this.setNode(ast.program)
  }

}
