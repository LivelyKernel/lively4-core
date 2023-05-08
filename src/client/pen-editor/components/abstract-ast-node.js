"enable aexpr";

/*MD 

# Pen Editor Abstract AST Node


Keywords: #Widget #Abstract

Authors: @onsetsu

MD*/


import Morph from 'src/components/widgets/lively-morph.js';

import keyInfo from 'src/client/keyinfo.js';
import d3 from 'src/external/d3.v5.js';
import { nodeEqual } from './utils.js';

import ComponentLoader from "src/client/morphic/component-loader.js";

async function prepareElementForPath(path, slotName, oldElement) {
  const [element, isNew] = await getAppropriateElement(path, oldElement);

  await element.setPath(path);

  element.slot= slotName;
  element.setAttribute('slot', slotName);

  return [element, isNew];
}

export async function getAppropriateElement(path, oldElement) {
  const newElementTag = getAppropriateElementTagName(path);
  const shouldReuseOldElement = oldElement && oldElement.constructor.name === newElementTag;
  const element = shouldReuseOldElement ? oldElement : await lively.create(newElementTag);

  return [element, !shouldReuseOldElement];
}

function matchesFunctionShorthand(path) {
  return path.isArrowFunctionExpression() &&
    path.node.expression === true &&
    path.get('params').length === 1 &&
    path.get('params')[0].isIdentifier();
}

function isSimpleMemberExpression(path) {
  return path.isMemberExpression() &&
    path.get('object').isIdentifier() &&
    !path.node.computed;
}

function matchesAccessFunctionShorthand(path) {
  return matchesFunctionShorthand(path) &&
    isSimpleMemberExpression(path.get('body')) &&
    path.get('params')[0].node.name === path.get('body.object').node.name;
}

function matchesCallFunctionShorthand(path) {
  return matchesFunctionShorthand(path) &&
    path.get('body').isCallExpression() &&
    path.get('body.arguments').length === 0 &&
    isSimpleMemberExpression(path.get('body.callee')) &&
    path.get('params')[0].node.name === path.get('body.callee.object').node.name;
}

function matchesSubmorphGetter(path) {
  return path.isClassMethod() &&
    path.node.kind === "get" &&
    path.get('key').isIdentifier() &&
    path.get('body').isBlockStatement() &&
    path.get('body.body').length === 1 &&
    path.get('body.body.0').isReturnStatement() &&
    path.get('body.body.0.argument').isCallExpression() &&
    path.get('body.body.0.argument.callee').isMemberExpression() &&
    path.get('body.body.0.argument.callee.object').isThisExpression() &&
    path.get('body.body.0.argument.callee.property').isIdentifier() &&
    path.get('body.body.0.argument.callee.property').node.name === 'get' &&
    !path.get('body.body.0.argument.callee').node.computed &&
    path.get('body.body.0.argument.arguments').length === 1 &&
    path.get('body.body.0.argument.arguments.0').isStringLiteral();
}

function getAppropriateElementTagName(path) {

  if (!path) {
    return 'generic-ast-node';
  }

  if (matchesAccessFunctionShorthand(path)) {
    return 'compound-node-access-function-shorthand';
  }
  if (matchesCallFunctionShorthand(path)) {
    return 'compound-node-call-function-shorthand';
  }
  
  if (matchesSubmorphGetter(path)) {
    return 'compound-node-submorph-getter';
  }
  
  
  if (path.node.type === 'Identifier') { return 'ast-node-identifier'; }
  if (path.node.type === 'Program') { return 'ast-node-program'; }
  if (path.node.type === 'ExpressionStatement') { return 'ast-node-expression-statement'; }
  if (path.node.type === 'VariableDeclaration') { return 'ast-node-variable-declaration'; }
  if (path.node.type === 'VariableDeclarator') { return 'ast-node-variable-declarator'; }
  if (path.node.type === 'CallExpression') { return 'ast-node-call-expression'; }
  if (path.node.type === 'ReturnStatement') { return 'ast-node-return-statement'; }
  if (path.node.type === 'AssignmentExpression') { return 'ast-node-assignment-expression'; }
  if (path.node.type === 'BinaryExpression') { return 'ast-node-binary-expression'; }
  if (path.node.type === 'NumericLiteral') { return 'ast-node-numeric-literal'; }
  if (path.node.type === 'MemberExpression') { return 'ast-node-member-expression'; }
  if (path.node.type === 'ArrowFunctionExpression') { return 'ast-node-arrow-function-expression'; }
  if (path.node.type === 'BlockStatement') { return 'ast-node-block-statement'; }
  if (path.node.type === 'RegExpLiteral') { return 'ast-node-reg-exp-literal'; }
  if (path.node.type === 'NullLiteral') { return 'ast-node-null-literal'; }
  if (path.node.type === 'StringLiteral') { return 'ast-node-string-literal'; }
  if (path.node.type === 'BooleanLiteral') { return 'ast-node-boolean-literal'; }
  if (path.node.type === 'EmptyStatement') { return 'ast-node-empty-statement'; }
  if (path.node.type === 'DebuggerStatement') { return 'ast-node-debugger-statement'; }
  if (path.node.type === 'WithStatement') { return 'ast-node-with-statement'; }
  if (path.node.type === 'LabeledStatement') { return 'ast-node-labeled-statement'; }
  if (path.node.type === 'BreakStatement') { return 'ast-node-break-statement'; }
  if (path.node.type === 'ContinueStatement') { return 'ast-node-continue-statement'; }
  if (path.node.type === 'IfStatement') { return 'ast-node-if-statement'; }
  if (path.node.type === 'SwitchStatement') { return 'ast-node-switch-statement'; }
  if (path.node.type === 'SwitchCase') { return 'ast-node-switch-case'; }
  if (path.node.type === 'ThrowStatement') { return 'ast-node-throw-statement'; }
  if (path.node.type === 'TryStatement') { return 'ast-node-try-statement'; }
  if (path.node.type === 'CatchClause') { return 'ast-node-catch-clause'; }
  if (path.node.type === 'WhileStatement') { return 'ast-node-while-statement'; }
  if (path.node.type === 'DoWhileStatement') { return 'ast-node-do-while-statement'; }
  if (path.node.type === 'ForStatement') { return 'ast-node-for-statement'; }
  if (path.node.type === 'ForInStatement') { return 'ast-node-for-in-statement'; }
  if (path.node.type === 'ForOfStatement') { return 'ast-node-for-of-statement'; }
  if (path.node.type === 'FunctionDeclaration') { return 'ast-node-function-declaration'; }
  if (path.node.type === 'Decorator') { return 'ast-node-decorator'; }
  if (path.node.type === 'Directive') { return 'ast-node-directive'; }
  if (path.node.type === 'DirectiveLiteral') { return 'ast-node-directive-literal'; }
  if (path.node.type === 'Super') { return 'ast-node-super'; }
  if (path.node.type === 'Import') { return 'ast-node-import'; }
  if (path.node.type === 'ThisExpression') { return 'ast-node-this-expression'; }
  if (path.node.type === 'YieldExpression') { return 'ast-node-yield-expression'; }
  if (path.node.type === 'AwaitExpression') { return 'ast-node-await-expression'; }
  if (path.node.type === 'ArrayExpression') { return 'ast-node-array-expression'; }
  if (path.node.type === 'ObjectExpression') { return 'ast-node-object-expression'; }
  if (path.node.type === 'ObjectMember') { return 'ast-node-object-member'; }
  if (path.node.type === 'ObjectProperty') { return 'ast-node-object-property'; }
  if (path.node.type === 'ObjectMethod') { return 'ast-node-object-method'; }
  if (path.node.type === 'FunctionExpression') { return 'ast-node-function-expression'; }
  if (path.node.type === 'UnaryExpression') { return 'ast-node-unary-expression'; }
  if (path.node.type === 'UnaryOperator') { return 'ast-node-unary-operator'; }
  if (path.node.type === 'UpdateExpression') { return 'ast-node-update-expression'; }
  if (path.node.type === 'UpdateOperator') { return 'ast-node-update-operator'; }
  if (path.node.type === 'LogicalExpression') { return 'ast-node-logical-expression'; }
  if (path.node.type === 'SpreadElement') { return 'ast-node-spread-element'; }
  if (path.node.type === 'BindExpression') { return 'ast-node-bind-expression'; }
  if (path.node.type === 'ConditionalExpression') { return 'ast-node-conditional-expression'; }
  if (path.node.type === 'NewExpression') { return 'ast-node-new-expression'; }
  if (path.node.type === 'SequenceExpression') { return 'ast-node-sequence-expression'; }
  if (path.node.type === 'DoExpression') { return 'ast-node-do-expression'; }
  if (path.node.type === 'TemplateLiteral') { return 'ast-node-template-literal'; }
  if (path.node.type === 'TaggedTemplateExpression') { return 'ast-node-tagged-template-expression'; }
  if (path.node.type === 'TemplateElement') { return 'ast-node-template-element'; }
  if (path.node.type === 'ObjectPattern') { return 'ast-node-object-pattern'; }
  if (path.node.type === 'ArrayPattern') { return 'ast-node-array-pattern'; }
  if (path.node.type === 'RestElement') { return 'ast-node-rest-element'; }
  if (path.node.type === 'AssignmentPattern') { return 'ast-node-assignment-pattern'; }
  if (path.node.type === 'ClassBody') { return 'ast-node-class-body'; }
  if (path.node.type === 'ClassMethod') { return 'ast-node-class-method'; }
  if (path.node.type === 'ClassPrivateMethod') { return 'ast-node-class-private-method'; }
  if (path.node.type === 'ClassProperty') { return 'ast-node-class-property'; }
  if (path.node.type === 'ClassPrivateProperty') { return 'ast-node-class-private-property'; }
  if (path.node.type === 'ClassDeclaration') { return 'ast-node-class-declaration'; }
  if (path.node.type === 'ClassExpression') { return 'ast-node-class-expression'; }
  if (path.node.type === 'MetaProperty') { return 'ast-node-meta-property'; }
  if (path.node.type === 'ModuleDeclaration') { return 'ast-node-module-declaration'; }
  if (path.node.type === 'ModuleSpecifier') { return 'ast-node-module-specifier'; }
  if (path.node.type === 'ImportDeclaration') { return 'ast-node-import-declaration'; }
  if (path.node.type === 'ImportSpecifier') { return 'ast-node-import-specifier'; }
  if (path.node.type === 'ImportDefaultSpecifier') { return 'ast-node-import-default-specifier'; }
  if (path.node.type === 'ImportNamespaceSpecifier') { return 'ast-node-import-namespace-specifier'; }
  if (path.node.type === 'ExportNamedDeclaration') { return 'ast-node-export-named-declaration'; }
  if (path.node.type === 'ExportSpecifier') { return 'ast-node-export-specifier'; }
  if (path.node.type === 'ExportDefaultDeclaration') { return 'ast-node-export-default-declaration'; }
  if (path.node.type === 'ExportAllDeclaration') { return 'ast-node-export-all-declaration'; }

  return 'generic-ast-node';
}

const SCOPE_MAP = new WeakMap();
let NEXT_SCOPE_ID = 0;

export default class AbstractAstNode extends Morph {

  get isAstNode() { return true; }

  static addChildType(astNodeType) {
    self.AstNodeTypes.push(astNodeType);
  }

  async initialize() {
    this.windowTitle = "AbstractAstNode";

    this.tabIndex = 0;

    this.initHover();
    this.addEventListener('click', evt => this.onClick(evt));
    this.addEventListener('keydown', evt => this.onKeydown(evt));
    // this.addEventListener('blur', evt => { lively.notify('blur', this.path.type); });
    this.addEventListener('focus', evt => { this.onFocus(evt); });
    // this.addEventListener('focusin', evt => { lively.notify('focusin', this.path.type); });
    // this.addEventListener('focusout', evt => { lively.notify('focusout', this.path.type); });
    this.addEventListener('copy', evt => this.onCopy(evt));
    this.addEventListener('cut', evt => this.onCut(evt));
    this.addEventListener('paste', evt => this.onPaste(evt));
    
    // color [0-360], saturation [0-1], lightness [0-1]
    // this.style.backgroundColor = `${d3.hsl(
    //   Math.random() * 360,
    //   Math.random() * 0.2 + 0.4,
    //   Math.random() * 0.2 + 0.8
    // )}`;
    this.classList.add('ast-node');
  }

  initHover() {
    this.addEventListener('mouseover', evt => this.onMouseOver(evt));
    this.addEventListener('mouseout', evt => this.onMouseOut(evt));
  }

  onMouseOver(evt) {
    evt.stopPropagation();
    this.classList.add('node-hover');
  }
  onMouseOut(evt) {
    this.classList.remove('node-hover');
  }
  onClick(evt) {
    evt.stopPropagation();
    const type = this.path && this.path.type;
    if (type) {
      lively.notify('clicked ' + type);
    } else {
      lively.warn('no type found for clicked element');
    }
    this.editor.navigation.onClickElement(this, evt);
  }
  onKeydown(evt) {
    const info = keyInfo(evt);
    const { char, ctrl, shift, alt, keyCode, charCode } = info;

    const handledByNavigation = this.editor.navigation.handleKeydown(this, evt);
    if (handledByNavigation) { return false; }
    
    if (ctrl && (info.backspace || info.del)) {
      lively.warn('should delete')
      return;
    }

    if (ctrl && char === 'C') {
      this.copyNodeToClipboard(evt);
      return;
    }

    if (ctrl && char === 'E') {
      this.extractExpressionIntoLocalVariable(evt);
      return;
    }

    info.notify();
    
    return false;
  }
  onFocus(evt) {
    this.editor.buildPathInfo();
  }
  onCopy(evt) {
    debugger
    lively.notify('copy')
  }
  onCut(evt) {
        lively.notify('cut')

  }
  onPaste(evt) {
        lively.notify('paste')

  }
  
  getAppropriateElement(path) {
    return getAppropriateElement(path);
  }
  
  extractExpressionIntoLocalVariable(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    
    const localName = window.prompt('name of local variable', 'temp');
    this.editor.commandExtractExpressionIntoLocalVariable(this, localName);
  }
  copyNodeToClipboard(evt) {
      lively.warn('should COPY')
    
  }
  
  get node() { return this._node; }
  set node(value) { return this._node = value; }

  get astNode() { return this._node; }
  set astNode(value) { return this._node = value; }

  addNodeStylingInfo(path) {
    let depth = -1;
    path.find(p => {
      depth++;
      return p.parentPath && p.scope !== p.parentPath.scope;
    });
    this.setAttribute('ast-node-scope', SCOPE_MAP.getOrCreate(path.scope, () => NEXT_SCOPE_ID++ % 20));
    this.setAttribute('ast-node-depth', depth);
    // this.style.setProperty("--my-border", `10px solid green`);
  }

  async setPath(path) {
    this.path = path;
    this.node = path.node;

    this.addNodeStylingInfo(path);
    await this.setNode(path.node);
  }
  
  async setNode(babelASTNode) {
    this.node = babelASTNode;

    await this.updateProjection(babelASTNode);
    
    return this;
  }

  async createSubElementForPath(astPath, slotName) {
    const oldElement = this.get(`:scope > [slot=${slotName}]`);
    
    if (!astPath.node) {
      oldElement && oldElement.remove();
      return;
    }
    
    const [element, isNew] = await prepareElementForPath(astPath, slotName, oldElement);

    if (oldElement) {
      if (isNew) {
        this.replaceChild(element, oldElement);
      }
    } else {
      this.appendChild(element);
    }
  }
  
  async createSubElementForPaths(paths, slotName) {
    paths;
    const currentChildren = this.getAllSubmorphs(`:scope > [slot=${slotName}]`);
    const currentMatches = new Map();

    paths.forEach(path => {
      const matchingChild = currentChildren.find(child => nodeEqual(path, child));
      if (matchingChild) {
        currentMatches.set(path, matchingChild);
      }
    });

    const [matchingOnly, both, nonMatching] = Array.from(currentMatches.values()).computeDiff(currentChildren);
    nonMatching.forEach(element => element.remove());

    const newElements = new Map();
    for (let path of paths) {
      if (path.node === null) { continue; }

      const oldElement = currentMatches.get(path);
      const [element, isNew] = await prepareElementForPath(path, slotName, oldElement);
      newElements.set(path, [element, isNew]);
    }

    paths.forEach(path => {
      const oldElement = currentMatches.get(path);

      // #Todo #Workaround some nodes allow for null elements in multi-child fields, e.g. ArrayExpression::elements could have `null` as an element
      if (!newElements.has(path)) { return; }
      const [element, isNew] = newElements.get(path);

      // append here
      if (oldElement) {
        if (isNew) {
          oldElement.remove();
        }
      }
      this.appendChild(element);
    });
  }
  
  removeSubElementInSlot(slotName) {
    const subElement = this.get(`:scope > [slot=${slotName}]`)
    if (subElement) {
      subElement.remove();
    }
  }
  
  get editor() {
    return this._editor = this._editor || lively.allParents(this, [], true).find(ele => ele.localName === 'pen-editor');
  }

  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) { throw new Error('livelyMigrate should not be called'); }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}

  get livelyUpdateStrategy() { return 'inplace'; }
  livelyUpdate() {
    this.updateFromTemplate();
    // lively.success("WRONG");
  }
  updateFromTemplate() {
    // #Paper #WebComponents #ObjectMigration
    // object migration strategy:
    // - keep identity
    // - but replace internal state
    // #TODO: was about external children
    // #TODO: reuse part of old state in more fine-grained manner
    // #GOAL: keep as much object identity as possible alive, due to potentially exposed references to internal state
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
  }
}
