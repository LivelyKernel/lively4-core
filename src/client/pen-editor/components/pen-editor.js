import Morph from 'src/components/widgets/lively-morph.js';

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import AbstractAstNode from './abstract-ast-node.js';
import d3 from 'src/external/d3.v5.js';

import { uuid, shake } from 'utils';
import { nodeEqual } from './utils.js';

import keyInfo from 'src/client/keyinfo.js';

import ContextMenu from 'src/client/contextmenu.js';

import focalStorage from 'src/external/focalStorage.js';

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
  
  undo() {
    const newIndex = Math.max(this.currentIndex - 1, 0);
    
    const isNew = newIndex < this.currentIndex;
    if (isNew) {
      this.currentIndex = newIndex;
      this.render();
    } else {
      this.shakeCurrentEntry();
    }
    return isNew;
  }
  
  redo() {
    const newIndex = Math.min(this.currentIndex + 1, this.inner.length - 1);
    
    const isNew = newIndex > this.currentIndex;
    if (isNew) {
      this.currentIndex = newIndex;
      this.render();
    } else {
      this.shakeCurrentEntry();
    }
    return isNew;
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
  
  get historyView() { return this.editor && this.editor.historyView; }
  
  render() {
    if (!this.editor) { return; }
    
    const historyView = this.historyView;
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
  
  shakeCurrentEntry() {
    if (!this.editor) { return; }
    
    const historyView = this.historyView;
    if (historyView && historyView.children && historyView.children[this.currentIndex]) {
      shake(historyView.children[this.currentIndex]);
    }
    
  }

}


function cancelEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}
  
class Navigation {

  get editor() { return this._editor; }
  setEditor(editor) {
    this._editor = editor;
    return this;
  }

  /*MD ### Utilities MD*/
  forwardList(ast, filterFunction = () => true) {
    const linearizedNodeList = [];
    ast.traverseAsAST({
      exit(path) {
        if (filterFunction(path)) {
          linearizedNodeList.push(path.node);
        }
      }
    });
    return linearizedNodeList;
  }
  backwardList(ast, filterFunction = () => true) {
    const linearizedNodeList = [];
    ast.traverseAsAST({
      enter(path) {
        if (filterFunction(path)) {
          linearizedNodeList.push(path.node);
        }
      }
    });
    return linearizedNodeList.reverse();
  }

  /*MD ### Selection MD*/
  get classSelected() { return 'node-selected'; }
  get selectorSelected() { return '.' + this.classSelected; }
  get primarySelector() { return ':focus, ast-node-identifier:focus-within, ast-node-numeric-literal:focus-within, ast-node-string-literal:focus-within'; }

  getPrimarySelection() {
    return this.editor.get(this.primarySelector);
  }

  getSelection() {
    return this.editor.getAllSubmorphs(this.selectorSelected);
  }
  toggleInSelection(element) {
    let selection = this.getSelection();
    let primary = this.getPrimarySelection();
    
    const wasSelected = selection.includes(element);
    const wasPrimary = primary === element;

    if (selection.length === 1 && wasSelected) {
      lively.warn('Cannot deselect last element.')
      return;
    }
    
    if (wasSelected) {
      primary = selection[(selection.indexOf(element) + 1) % selection.length]
      selection = selection.filter(ele => ele !== element);
    } else {
      primary = element;
      selection.push(element);
    }
    
    this.setSelection(selection, primary);
  }
  setSelection(selectedElements, primaryElement) {
    // remove selection
    this.getSelection().forEach(element => element.classList.remove(this.classSelected));

    if (primaryElement && !primaryElement.matches(this.primarySelector)) {
      primaryElement.focus();
    }
    for (let selectedElement of selectedElements.values()) {
      selectedElement.classList.add(this.classSelected);
    }
    
    this.editor.buildPathInfo();
  }

  getElementForNode(node) {
    return this.editor.getElementForNode(node);
  }
  transformSelection(getNextSelection) {
    const selectedElements = this.getSelection();
    const primarySelection = this.getPrimarySelection();
    
    const newElements = [];
    let newPrimarySelection;
    
    selectedElements.forEach(selectedElement => {
      const target = getNextSelection(selectedElement);
      if (target) {
        newElements.push(target);
        if (primarySelection === selectedElement) {
          newPrimarySelection = target;
        }
      } else {
        lively.warn('No navigation target found.')
      }
    });
    
    this.setSelection(newElements, newPrimarySelection);
  }

  /*MD ### Navigation Handler MD*/
  up(element, evt) {
    cancelEvent(evt);

    this.transformSelection(selectedElement => {
      if (
        selectedElement.parentElement &&
        selectedElement.parentElement.isAstNode &&
        selectedElement.parentElement.localName !== 'ast-node-program'
      ) {
        return selectedElement.parentElement;
      } else {
        lively.warn('Top-level node reached.')
        return selectedElement;
      }
    });
  }
  navNextInList(element, evt, linearizedNodeList) {
    this.transformSelection(selectedElement => {
      const currentNode = linearizedNodeList.find(n => nodeEqual(n, selectedElement.astNode));
      const currentIndex = linearizedNodeList.indexOf(currentNode);
      const newNode = linearizedNodeList.find((node, index) => {
        if (index <= currentIndex) { return false; }
        const element = node && this.getElementForNode(node);
        return element && element.style && element.style.display !== 'none';
      });
      if (newNode) {
        const target = this.getElementForNode(newNode);
        if (target && target.localName !== 'ast-node-program') {
          return target;
        }
      }
      return selectedElement;
    });
  }
  left(element, evt) {
    cancelEvent(evt);

    const linearizedNodeList = this.backwardList(element.editor.history.current());
    this.navNextInList(element, evt, linearizedNodeList);
    return;
  }
  right(element, evt) {
    cancelEvent(evt);

    const linearizedNodeList = this.forwardList(element.editor.history.current());
    this.navNextInList(element, evt, linearizedNodeList);
    return;
  }
  down(element, evt) {
    cancelEvent(evt);

    function getFirstChildNode(currentNode, ast) {
      let target;
      ast.traverseAsAST({
        enter(path) {
          if (nodeEqual(currentNode, path.node)) {
            path.traverse({
              enter(pathChild) {
                target = target || pathChild.node;
              }
            });
          }
        }
      });
      return target;
    }

    const ast = element.editor.history.current();
    this.transformSelection(selectedElement => {
      const child = getFirstChildNode(selectedElement.astNode, ast);
      if (child) {
        const newElement = this.getElementForNode(child)
        if (newElement) {
          return newElement;
        } else {
          lively.warn('no element for child found')
        }
      } else {
        lively.warn('no child found')
      }
      return selectedElement;
    });
  }
  // alt-escape
  clear(element, evt) {
    cancelEvent(evt);

    const focussedElement = this.getPrimarySelection();

    if(focussedElement) {
      this.setSelection([focussedElement], focussedElement);
    }

    return true;
  }
  
  nextEquivalentIdentifier(element, evt, backwards) {
    cancelEvent(evt);
    
    const ast = element.editor.history.current();
    const nodeList = backwards ? this.backwardList(ast) : this.forwardList(ast);
    
    this.transformSelection(selectedElement => {
      const currentNode = nodeList.find(n => nodeEqual(n, selectedElement.astNode));
      const currentIndex = nodeList.indexOf(currentNode);
      
      if (selectedElement.path.isIdentifier()) {
        const name = currentNode.name;
        lively.notify('searching', name);

        const isAppropriateIdentifier = node => {
          return node.type === 'Identifier' &&
            node.name === name &&
            this.getElementForNode(node);
        };
        
        const newNode = nodeList.find((node, index) => index > currentIndex && isAppropriateIdentifier(node));
        if (newNode) {
          return this.getElementForNode(newNode);
        } else {
          const fallbackNode = nodeList.find(isAppropriateIdentifier);
          if (fallbackNode) {
            return this.getElementForNode(fallbackNode);
          } else {
            return selectedElement;
          }
        }
      } else {
        // #TODO: select next identifier
        return selectedElement;
      }
    });
  }

  goToOutermostScopeNode(element, evt) {
    cancelEvent(evt);
    
    this.transformSelection(selectedElement => {
      const path = selectedElement.path;

      // we are already at Program level
      if (!path.parentPath) {
        lively.notify('no parent path! We are a ' + path.node.type);
        return selectedElement;
      }
      
      const newPath = path.findParent(p => {
        if (p.isProgram()) { return true; }
        return p.parentPath && p.scope !== p.parentPath.scope;
      });
      
      if (!newPath) {
        lively.warn('no new parent found for ' + newPath.node.type);
        return selectedElement;
      }
      
      return this.getElementForNode(newPath.node);
    });
  }

  handleKeydown(element, evt) {
    const info = keyInfo(evt);
    const { ctrl } = info;

    if (ctrl) { return false; }

    if (info.up) {
      this.up(element, evt);
      return true;
    } else if (info.left) {
      this.left(element, evt);
      return true;
    } else if (info.right) {
      this.right(element, evt);
      return true;
    } else if (info.down) {
      this.down(element, evt);
      return true;
    } else if (info.escape) {
      this.clear(element, evt);
      return true;
    } else if (info.tab) {
      this.nextEquivalentIdentifier(element, evt, info.shift);
      return true;
    } else if (info.pageup) {
      this.goToOutermostScopeNode(element, evt);
      return true;
    }

    return false;
  }
  
  onClickElement(element, evt) {
    cancelEvent(evt);

    if(evt.ctrlKey) {
      this.toggleInSelection(element);
    } else {
      this.setSelection([element], element);
    }
  }
}

/*MD # PenEditor MD*/
export default class PenEditor extends Morph {

  static get defaultFile() { return lively4url + '/src/client/pen-editor/demos/example.js'; }
  /*MD ## Accessors MD*/
  get fileName() { return this.get('input#fileName'); }
  get historyView() { return this.get('#history'); }
  get projectionChild() { return this; }
  get lcm() { return this.get('#lcm'); }
  get inspector() { return this.get('#inspector'); }

  get history() { return this._history = this._history || new History().setEditor(this); }
  set history(value) { return this._history = value; }

  get navigation() { return this._navigation = this._navigation || new Navigation().setEditor(this); }
  set navigation(value) { return this._navigation = value; }

  trace(method) {
    this._ordering = this._ordering || 1;
    return lively.success(this._ordering++ + ': ' + method);
  }

  initialize() {
    this.trace('initialize PEN Editor')
    this.windowTitle = "AST Editor";
    
    this.registerButtons();
    
    this.initFileInput();
    
    this.addEventListener('keydown', evt => this.onKeydown(evt));

    this.initToggleButtons();
    this.initLCM();
    this.initStyle();
  }
  
  /*MD ## Options MD*/
  _asPersistenceKey(key) { return 'pen-editor-' + key; }
  async getOption(key, defaultValue) {
    const persistedValue = await focalStorage.getItem(this._asPersistenceKey(key));
    return persistedValue || defaultValue;
  }
  async setOption(key, value) {
    return focalStorage.setItem(this._asPersistenceKey(key), value);
  }
  /*MD ## Styles MD*/
  styleDefault() {
    return `
ast-node-directive::before {
  content: "default style";
} 
.the-class::part(this-is-a-test) {
  color: red;
}
`;
  }

  styleNesting() {
    return `
.ast-node {
  margin: 1px;
/*   padding: 1px; */
  border: 1px solid goldenrod;
  background-color: #eeeeee;
}
`;
  }

  styleColorizeVariables() {
    const identifierStyles = [];
    _.range(200).forEach(identifierId => {
      let color = d3.hsl(
        Math.random() * 360,
        0.6,
        0.5
      );
      identifierStyles.push(`ast-node-identifier[ast-node-identifier-id="${identifierId}"]::part(input-field) {
  color: ${color};
  font-weight: bold;
}`);
    });
    return `
ast-node-directive::before {
  content: "colorize variables";
}
${identifierStyles.join('\n\r')}
`;
  }

  styleColorizeScopes() {
    const scopeStyles = [];
    _.range(20).forEach(scopeId => {
      let color;
      _.range(20).forEach(depth => {
        if (depth === 0) {
          color = d3.hsl(
            Math.random() * 360,
            0.5,
            0.7
          );
        } else {
          color = color.brighter(0.1);
        }
        scopeStyles.push(`.ast-node[ast-node-scope="${scopeId}"][ast-node-depth="${depth}"] {
      background-color: ${color};
      border: 1px solid ${color};
    }`);
      });
    });

    return `
ast-node-directive::before {
  content: "colorize scopes";
} 
.the-class::part(this-is-a-test) {
  color: red;
}
ast-node-identifier {
/* border: 3px solid red; */
}
::part(input-field) {

}
ast-node-identifier::part(prim) {
  border: 3px solid yellow;
}
ast-node-identifier::part(input-field) {
  font-weight: bold;

/*
  color: red;
  border: 3px solid blue;
  font-style: underline;
*/
}
.ast-node {
  background-color: #cfeea7;
}
.ast-node {
/*  border: 1px solid goldenrod; */
}
${scopeStyles.join('\n\r')}
`;
  }

  /*MD ## Handle Styling MD*/

  get styleId() { return 'pen-editor-style'; }
  get styleSelector() { return `#${this.styleId}`; }
  get stylePersistKey() { return 'style-type'; }
  get styleTypeDefault() { return 'styleDefault'; }

  async initStyle({
    force = false,
    type
  } = {}) {
    if (type) {
      this.setOption(this.stylePersistKey, type);
    } else {
      type = await this.getOption(this.stylePersistKey, this.styleTypeDefault);
    }

    const oldStyle = document.body.querySelector(this.styleSelector);
    
    // replace style
    if (force || !oldStyle || oldStyle.getAttribute('data-style-type') !== type) {
      this.replaceStyle(type);
    }
  }

  replaceStyle(type) {
    document.body.querySelectorAll(this.styleSelector).forEach(style => style.remove());

    const css = this[type]();
    const style = <style id={this.styleId} data-style-type={type} type="text/css">{css}</style>;
    document.body.appendChild(style);
  }

  async openStyleContextMenu(evt) {
    const updateStyleTo = type => {
      menu.remove();
      this.initStyle({ type, force: true });
      // #TODO: re-apply focus
    };
    const menuItems = [
      ['default', () => updateStyleTo(this.styleTypeDefault), 'plain gray-ish', '<i class="fa fa-circle"></i>'],
      ['variable', () => updateStyleTo('styleColorizeVariables'), 'font-color for variables', '<i class="fa fa-share"></i>'],
      ['scopes', () => updateStyleTo('styleColorizeScopes'), 'background-color for scopes', '<i class="fa fa-th-large"></i>'],
      ['nesting', () => updateStyleTo('styleNesting'), 'borders for ast node nesting', '<i class="fa fa-th-large"></i>'],
      
    ];
    
    const menu = await ContextMenu.openIn(document.body, undefined, undefined, document.body,  menuItems);
    evt.stopPropagation();
    evt.preventDefault();
  }
  
  /*MD ## Misc. MD*/
  
  initFileInput() {
    this.fileName.value = PenEditor.defaultFile;
    
    this.fileName.addEventListener('keydown', async evt => {
      const info = keyInfo(evt);
      const { char, meta, ctrl, shift, alt, keyCode, charCode, enter } = info;
      
      if (enter) {
        await this.loadFile(this.fileName.value);
      }

    });
  }
  initToggleButtons() {
    this.initToggleButton({
      button: this.get('#toggleInspector'),
      target: this.inspector,
      persistAttribute: 'show-inspector',
    });
    this.initToggleButton({
      button: this.get('#toggleCodeMirror'),
      target: this.lcm,
      persistAttribute: 'show-code-mirror',
    });
  }
  initToggleButton({
    button, hideClassButton = 'toggle-button-hide', showClassButton = 'toggle-button-show',
    target, hideClassTarget = 'toggle-target-hide', showClassTarget = 'toggle-target-show',
    defaultValue = false, persistAttribute
  }) {
    let shown = this.hasAttribute(persistAttribute) ?
        JSON.parse(this.getAttribute(persistAttribute)) :
        defaultValue;
    
    const updateToggleState = () => {
      button.classList.toggle(showClassButton, shown);
      button.classList.toggle(hideClassButton, !shown);
      target.classList.toggle(showClassTarget, shown);
      target.classList.toggle(hideClassTarget, !shown);
      if (shown && target.tagName === 'LIVELY-CODE-MIRROR') {
        target.editorLoaded().then(() => target.editor.refresh());
      }
      this.setAttribute(persistAttribute, JSON.stringify(shown))
    }

    updateToggleState();
    button.addEventListener('click', evt => {
      shown = !shown;
      updateToggleState();
    });
  }
  initLCM() {
    this.lcm.editorLoaded().then(() => {
      this.lcm.registerExtraKeys({
        'Ctrl-Shift-S': cm => {
          lively.files.saveFile(this.fileName.value, this.lcm.value);
        }
      });
      // Ctrl-S
      this.lcm.doSave = text => this.onLCMSave(text);
    });
  }
  onLCMSave(text) {
    this.setAST(text.toAST());
  }
  onKeydown(evt) {
    const info = keyInfo(evt);
    const { char, meta, ctrl, shift, alt, keyCode, charCode } = info;
    
    if (alt && char === 'Z') {
      if (this.history.undo()) {
        this.project(this.history.current());
      }
      return;
    } else if (alt && (char === 'Y' || (shift && char === 'Z'))) {
      if (this.history.redo()) {
        this.project(this.history.current());
      }
      return;
    } else if (alt && info.char === "S") {
      this.openStyleContextMenu(evt);
    }
    
    info.notify();
  }
  
  getElementForNode(node) {
    return this.querySelectorAll('*').find(element => nodeEqual(element.astNode, node));
  }
  
  async setAST(ast) {
    this.assignUUIDsForAllNodes(ast);
    this.addToHistory(ast);
    this.project(ast);
  }
  
  assignUUIDsForAllNodes(ast) {
    ast.traverseAsAST({
      enter: path => this.ensureUUID(path.node)
    });
  }
  
  ensureUUID(node) {
    node.uuid = node.uuid || uuid();
  }
  
  addToHistory(ast) {
    this.history.add(ast);
  }
  
  onTestButton(evt) {
    const current = this.history.current();
    const ast = current.cloneDeep();

    ast.traverseAsAST({
      Identifier(path) {
        path.node.name += 'X';
      }
    });
    
    this.setAST(ast);
  }
  onComplexTransform(evt) {
    lively.showElement(this.get(':focus'));
    const current = this.history.current();
    const ast = current.cloneDeep();

    ast.traverseAsAST({
      Identifier(path) {
        path.node.name += 'Y';
      }
    });
    
    this.setAST(ast);
  }
  
  changeIdentifier(node, newName) {
    const current = this.history.current();
    let ast = current.cloneDeep();

    ast.traverseAsAST({
      Identifier(path) {
        if (nodeEqual(path.node, node)) {
          path.node.name = newName;
        }
      }
    });
    
    this.setAST(ast);
  }
  
  commandToggleBooleanLiteral(node) {
    const current = this.history.current();
    let ast = current.cloneDeep();

    ast.traverseAsAST({
      BooleanLiteral(path) {
        if (nodeEqual(path, node)) {
          path.node.value = !path.node.value;
        }
      }
    });
    
    this.setAST(ast);
  }
  
  commandModifyNumericLiteral(node, value) {
    const current = this.history.current();
    let ast = current.cloneDeep();

    ast.traverseAsAST({
      NumericLiteral(path) {
        if (nodeEqual(path, node)) {
          path.node.value = value;
        }
      }
    });
    
    this.setAST(ast);
  }
  
  onResetHistory() {
    this.history.clear();
  }
  
  onToggleInspector() {}
  onToggleCodeMirror() {}
  
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
  
  getProgramPath(ast) {
    let programPath;
    ast.traverseAsAST({
      Program(path) {
        programPath = path;
      }
    });
    return programPath;
  }
  
  async buildProjection(ast) {
    const path = this.getProgramPath(ast);
    await AbstractAstNode.prototype.createSubElementForPath.call(this, path, 'ast');
    this.get(':scope > [slot=ast]').updateStyleSheet();
  }

  async buildTransformation(ast) {
    this.lcm.value = ast.transformAsAST().code
  }
  
  get pathInfo() { return this.get('#path-info'); }
  buildPathInfo() {
    const selection = this.navigation.getSelection();

    function joinElements(elements, builder) {
      
    }
    this.pathInfo.innerHTML = selection
      .map(element => {
        const list = [];
        element.path.find(p => { list.unshift(p); });
        
        return `<div>${list.map(p => p.type).join('<i class="fa fa-angle-right" aria-hidden="true"></i>')}</div>`;
      })
      .join('');
  }

  livelyMigrate(other) {
    this.trace('livelyMigrate (PEN Editor Migrate)')
    
    this.history = other.history.setEditor(this);
    const ast = this.history.current()
    this.project(ast);
  }
  
  async livelyExample() {
    this.trace('livelyExample (PEN Editor Example)')
    
    await this.loadFile(PenEditor.defaultFile);
  }
  
  async loadFile(filePath) {
    const source = await filePath.fetchText();
    const ast = source.toAST();

    this.history.clear();
    this.setAST(ast)
  }
  
  // #TODO: implement
  async saveFile(filePath) {}
  
  get livelyUpdateStrategy() { return 'inplace'; }
  livelyUpdate() {
    this.xxx = this.xxx || Math.random();
    lively.notify(this.xxx)
    this.initStyle({ force: true });
  }
  
}

document.querySelectorAll("pen-editor").forEach(pe => {
  const history = pe.history;
  if (history) {
    // evil live programming
    history.constructor = History

    // we can fix this, so we can do live development again....
    history.__proto__ = History.prototype
  }
  const navigation = pe.navigation;
  if (navigation) {
    // evil live programming
    navigation.constructor = Navigation

    // we can fix this, so we can do live development again....
    navigation.__proto__ = Navigation.prototype
  }
});
