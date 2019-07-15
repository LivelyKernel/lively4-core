import Morph from 'src/components/widgets/lively-morph.js';

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import { uuid } from 'utils';

import Keys from 'src/client/keys.js';

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

class History {

  constructor() {
    this.inner = [];
    this.currentIndex = -1;
  }
  
  setEditor(editor) {
    this.editor = editor;
    
    this.render();

    return this;
  }
  
  add(item) {
    this.inner.length = this.currentIndex + 1;
    this.currentIndex += 1;
    this.inner.push(item);

    this.render();
  }
  
  jumpTo(index) {
    this.currentIndex = index;

    this.render();
    
    return this.current();
  }
  
  current() {
    return this.inner[this.currentIndex];
  }
  
  clear() {
    this.inner.length = 0;
    this.currentIndex = -1;

    this.render();
  }
  
  render() {
    if (!this.editor) { return; }
    
    const historyView = this.editor.historyView;
    historyView.innerHTML = '';
    
    this.inner
      .map((ast, id) => {
        const clickHandler = evt => this.editor.onSelectHistoryEntry(evt, ast, id);

        const element = <span class="history-entry" click={clickHandler}>{id}</span>
        if (this.currentIndex === id) {
          element.classList.add('selected');
        }
        
        return element;
      })
      .forEach(element => historyView.appendChild(element));
  }

}

export default class PenEditor extends Morph {

  get fileName() { return this.get('input#fileName'); }
  get historyView() { return this.get('#history'); }
  get projectionChild() { return this; }
  get lcm() { return this.get('#lcm'); }
  get inspector() { return this.get('#inspector'); }

  trace(method) {
    this._ordering = this._ordering || 1;
    return lively.success(this._ordering++ + ': ' + method);
  }

  get history() { return this._history = this._history || new History().setEditor(this); }
  set history(value) { return this._history = value; }

  initialize() {
    this.trace('initialize PEN Editor')
    this.windowTitle = "AST Editor";
    
    this.registerButtons();
    
    this.fileName.value = lively4url + '/src/client/pen-editor/components/example.js';
    
    this.addEventListener('keydown', evt => this.onKeydown(evt));
  }
  onKeydown(evt) {
    const { char, ctrl, shift, alt, keyCode, charCode } = Keys.keyInfo(evt);
    
    lively.warn(`${char} [${ctrl ? 'ctrl' : ''}, ${shift ? 'shift' : ''}, ${alt ? 'alt' : ''}]`);
    if (ctrl && char === 'Z') {
      
    } else if (ctrl && (char === 'Y' || (shift && char === 'Z'))) {
      
    }
  }
  
  async setAST(ast) {
    this.addToHistory(ast)
    this.project(ast);
  }
  
  addToHistory(ast) {
    this.history.add(ast);
  }
  
  onTestButton(evt) {
    const current = this.history.current();
    let ast = current.cloneDeep();

    ast.traverseAsAST({
      Identifier(path) {
        path.node.name += 'X';
      }
    });
    
    this.setAST(ast);
  }
  
  onResetHistory() {
    this.history.clear();
  }
  
  onToggleInspector() {
    this.inspector.classList.toggle('hidden')
  }
  onToggleCodeMirror() {
    this.lcm.classList.toggle('hidden')
  }
  
  onSelectHistoryEntry(evt, ast, id) {
    const ast2 = this.history.jumpTo(id);
    this.project(ast2);
  }
  
  project(ast) {
    this.inspectAST(ast);
    this.buildProjection(ast);
    this.buildTransformation(ast);
  }
  
  inspectAST(ast) {
    this.inspector.hideWorkspace()
    this.inspector.inspect(ast)
  }
  
  async buildProjection(ast) {
    var astNode = await (<generic-ast-node></generic-ast-node>);
    this.projectionChild.innerHTML = '';
    this.projectionChild.appendChild(astNode);
    astNode.setNode(ast.program);
  }

  async buildTransformation(ast) {
    this.lcm.value = ast.transformAsAST().code
  }

  livelyMigrate(other) {
    this.trace('livelyMigrate (PEN Editor Migrate)')
    
    this.history = other.history.setEditor(this);
    const ast = this.history.current()
    this.project(ast);
  }
  
  async livelyExample() {
    this.trace('livelyExample (PEN Editor Example)')
    
    await this.loadFile(lively4url + '/src/client/pen-editor/components/example.js');
  }
  
  async loadFile(filePath) {
    const source = await filePath.fetchText();
    const ast = source.toAST();

    this.history.clear();
    this.setAST(ast)
  }
  
  // #TODO: implement
  async saveFile(filePath) {}
  
}

document.querySelectorAll("pen-editor").forEach(pe => {
  const history = pe.history;
  if (history) {
    // evil live programming
    history.constructor === History

    // we can fix this, so we can do live development again....
    history.__proto__ = History.prototype
  }
});
