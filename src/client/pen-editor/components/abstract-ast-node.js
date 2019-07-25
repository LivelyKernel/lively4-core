"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import Keys from 'src/client/keys.js';

async function getAppropriateNode(babelASTNode) {

  if (!babelASTNode) {
    return <generic-ast-node></generic-ast-node>;
  }

  // handle pathes like this for now
  if (babelASTNode.node) {
    return getAppropriateNode(babelASTNode.node);
  }
  
  if (babelASTNode.type === 'Identifier') { return <ast-node-identifier></ast-node-identifier>; }
  if (babelASTNode.type === 'Program') { return <ast-node-program></ast-node-program>; }
  if (babelASTNode.type === 'ExpressionStatement') { return <ast-node-expression-statement></ast-node-expression-statement>; }
  if (babelASTNode.type === 'VariableDeclaration') { return <ast-node-variable-declaration></ast-node-variable-declaration>; }
  if (babelASTNode.type === 'VariableDeclarator') { return <ast-node-variable-declarator></ast-node-variable-declarator>; }
  if (babelASTNode.type === 'CallExpression') { return <ast-node-call-expression></ast-node-call-expression>; }
  if (babelASTNode.type === 'ReturnStatement') { return <ast-node-return-statement></ast-node-return-statement>; }
  if (babelASTNode.type === 'AssignmentExpression') { return <ast-node-assignment-expression></ast-node-assignment-expression>; }
  if (babelASTNode.type === 'BinaryExpression') { return <ast-node-binary-expression></ast-node-binary-expression>; }
  if (babelASTNode.type === 'NumericLiteral') { return <ast-node-numeric-literal></ast-node-numeric-literal>; }
  if (babelASTNode.type === 'MemberExpression') { return <ast-node-member-expression></ast-node-member-expression>; }
  if (babelASTNode.type === 'ArrowFunctionExpression') { return <ast-node-arrow-function-expression></ast-node-arrow-function-expression>; }
  if (babelASTNode.type === 'BlockStatement') { return <ast-node-block-statement></ast-node-block-statement>; }
  if (babelASTNode.type === 'RegExpLiteral') { return <ast-node-reg-exp-literal></ast-node-reg-exp-literal>; }
  if (babelASTNode.type === 'NullLiteral') { return <ast-node-null-literal></ast-node-null-literal>; }
  if (babelASTNode.type === 'StringLiteral') { return <ast-node-string-literal></ast-node-string-literal>; }
  if (babelASTNode.type === 'BooleanLiteral') { return <ast-node-boolean-literal></ast-node-boolean-literal>; }
  if (babelASTNode.type === 'EmptyStatement') { return <ast-node-empty-statement></ast-node-empty-statement>; }
  if (babelASTNode.type === 'DebuggerStatement') { return <ast-node-debugger-statement></ast-node-debugger-statement>; }
  if (babelASTNode.type === 'WithStatement') { return <ast-node-with-statement></ast-node-with-statement>; }
  if (babelASTNode.type === 'LabeledStatement') { return <ast-node-labeled-statement></ast-node-labeled-statement>; }
  if (babelASTNode.type === 'BreakStatement') { return <ast-node-break-statement></ast-node-break-statement>; }
  if (babelASTNode.type === 'ContinueStatement') { return <ast-node-continue-statement></ast-node-continue-statement>; }
  if (babelASTNode.type === 'IfStatement') { return <ast-node-if-statement></ast-node-if-statement>; }
  if (babelASTNode.type === 'SwitchStatement') { return <ast-node-switch-statement></ast-node-switch-statement>; }
  if (babelASTNode.type === 'SwitchCase') { return <ast-node-switch-case></ast-node-switch-case>; }
  if (babelASTNode.type === 'ThrowStatement') { return <ast-node-throw-statement></ast-node-throw-statement>; }
  if (babelASTNode.type === 'TryStatement') { return <ast-node-try-statement></ast-node-try-statement>; }
  if (babelASTNode.type === 'CatchClause') { return <ast-node-catch-clause></ast-node-catch-clause>; }
  if (babelASTNode.type === 'WhileStatement') { return <ast-node-while-statement></ast-node-while-statement>; }
  if (babelASTNode.type === 'DoWhileStatement') { return <ast-node-do-while-statement></ast-node-do-while-statement>; }
  if (babelASTNode.type === 'ForStatement') { return <ast-node-for-statement></ast-node-for-statement>; }
  if (babelASTNode.type === 'ForInStatement') { return <ast-node-for-in-statement></ast-node-for-in-statement>; }
  if (babelASTNode.type === 'ForOfStatement') { return <ast-node-for-of-statement></ast-node-for-of-statement>; }
  if (babelASTNode.type === 'FunctionDeclaration') { return <ast-node-function-declaration></ast-node-function-declaration>; }
  if (babelASTNode.type === 'Decorator') { return <ast-node-decorator></ast-node-decorator>; }
  if (babelASTNode.type === 'Directive') { return <ast-node-directive></ast-node-directive>; }
  if (babelASTNode.type === 'DirectiveLiteral') { return <ast-node-directive-literal></ast-node-directive-literal>; }
  if (babelASTNode.type === 'Super') { return <ast-node-super></ast-node-super>; }
  if (babelASTNode.type === 'Import') { return <ast-node-import></ast-node-import>; }
  if (babelASTNode.type === 'ThisExpression') { return <ast-node-this-expression></ast-node-this-expression>; }
  if (babelASTNode.type === 'YieldExpression') { return <ast-node-yield-expression></ast-node-yield-expression>; }
  if (babelASTNode.type === 'AwaitExpression') { return <ast-node-await-expression></ast-node-await-expression>; }
  if (babelASTNode.type === 'ArrayExpression') { return <ast-node-array-expression></ast-node-array-expression>; }
  if (babelASTNode.type === 'ObjectExpression') { return <ast-node-object-expression></ast-node-object-expression>; }
  if (babelASTNode.type === 'ObjectMember') { return <ast-node-object-member></ast-node-object-member>; }
  if (babelASTNode.type === 'ObjectProperty') { return <ast-node-object-property></ast-node-object-property>; }
  if (babelASTNode.type === 'ObjectMethod') { return <ast-node-object-method></ast-node-object-method>; }
  if (babelASTNode.type === 'FunctionExpression') { return <ast-node-function-expression></ast-node-function-expression>; }
  if (babelASTNode.type === 'UnaryExpression') { return <ast-node-unary-expression></ast-node-unary-expression>; }
  if (babelASTNode.type === 'UnaryOperator') { return <ast-node-unary-operator></ast-node-unary-operator>; }
  if (babelASTNode.type === 'UpdateExpression') { return <ast-node-update-expression></ast-node-update-expression>; }
  if (babelASTNode.type === 'UpdateOperator') { return <ast-node-update-operator></ast-node-update-operator>; }
  if (babelASTNode.type === 'LogicalExpression') { return <ast-node-logical-expression></ast-node-logical-expression>; }
  if (babelASTNode.type === 'SpreadElement') { return <ast-node-spread-element></ast-node-spread-element>; }
  if (babelASTNode.type === 'BindExpression') { return <ast-node-bind-expression></ast-node-bind-expression>; }
  if (babelASTNode.type === 'ConditionalExpression') { return <ast-node-conditional-expression></ast-node-conditional-expression>; }
  if (babelASTNode.type === 'NewExpression') { return <ast-node-new-expression></ast-node-new-expression>; }
  if (babelASTNode.type === 'SequenceExpression') { return <ast-node-sequence-expression></ast-node-sequence-expression>; }
  if (babelASTNode.type === 'DoExpression') { return <ast-node-do-expression></ast-node-do-expression>; }
  if (babelASTNode.type === 'TemplateLiteral') { return <ast-node-template-literal></ast-node-template-literal>; }
  if (babelASTNode.type === 'TaggedTemplateExpression') { return <ast-node-tagged-template-expression></ast-node-tagged-template-expression>; }
  if (babelASTNode.type === 'TemplateElement') { return <ast-node-template-element></ast-node-template-element>; }
  if (babelASTNode.type === 'ObjectPattern') { return <ast-node-object-pattern></ast-node-object-pattern>; }
  if (babelASTNode.type === 'ArrayPattern') { return <ast-node-array-pattern></ast-node-array-pattern>; }
  if (babelASTNode.type === 'RestElement') { return <ast-node-rest-element></ast-node-rest-element>; }
  if (babelASTNode.type === 'AssignmentPattern') { return <ast-node-assignment-pattern></ast-node-assignment-pattern>; }
  if (babelASTNode.type === 'ClassBody') { return <ast-node-class-body></ast-node-class-body>; }
  if (babelASTNode.type === 'ClassMethod') { return <ast-node-class-method></ast-node-class-method>; }
  if (babelASTNode.type === 'ClassPrivateMethod') { return <ast-node-class-private-method></ast-node-class-private-method>; }
  if (babelASTNode.type === 'ClassProperty') { return <ast-node-class-property></ast-node-class-property>; }
  if (babelASTNode.type === 'ClassPrivateProperty') { return <ast-node-class-private-property></ast-node-class-private-property>; }
  if (babelASTNode.type === 'ClassDeclaration') { return <ast-node-class-declaration></ast-node-class-declaration>; }
  if (babelASTNode.type === 'ClassExpression') { return <ast-node-class-expression></ast-node-class-expression>; }
  if (babelASTNode.type === 'MetaProperty') { return <ast-node-meta-property></ast-node-meta-property>; }
  if (babelASTNode.type === 'ModuleDeclaration') { return <ast-node-module-declaration></ast-node-module-declaration>; }
  if (babelASTNode.type === 'ModuleSpecifier') { return <ast-node-module-specifier></ast-node-module-specifier>; }
  if (babelASTNode.type === 'ImportDeclaration') { return <ast-node-import-declaration></ast-node-import-declaration>; }
  if (babelASTNode.type === 'ImportSpecifier') { return <ast-node-import-specifier></ast-node-import-specifier>; }
  if (babelASTNode.type === 'ImportDefaultSpecifier') { return <ast-node-import-default-specifier></ast-node-import-default-specifier>; }
  if (babelASTNode.type === 'ImportNamespaceSpecifier') { return <ast-node-import-namespace-specifier></ast-node-import-namespace-specifier>; }
  if (babelASTNode.type === 'ExportNamedDeclaration') { return <ast-node-export-named-declaration></ast-node-export-named-declaration>; }
  if (babelASTNode.type === 'ExportSpecifier') { return <ast-node-export-specifier></ast-node-export-specifier>; }
  if (babelASTNode.type === 'ExportDefaultDeclaration') { return <ast-node-export-default-declaration></ast-node-export-default-declaration>; }
  if (babelASTNode.type === 'ExportAllDeclaration') { return <ast-node-export-all-declaration></ast-node-export-all-declaration>; }
  
  return <generic-ast-node></generic-ast-node>;
}

export default class AbstractAstNode extends Morph {

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
    // this.addEventListener('focus', evt => { lively.notify('focus', this.path.type); });
    // this.addEventListener('focusin', evt => { lively.notify('focusin', this.path.type); });
    // this.addEventListener('focusout', evt => { lively.notify('focusout', this.path.type); });
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
  }
  onKeydown(evt) {
    const { char, ctrl, shift, alt, keyCode, charCode } = Keys.keyInfo(evt);

    if (alt && keyCode === 38) {
      // Alt-up
      return this.editor.navigation.up(this, evt);
    } else if (alt && keyCode === 37) {
      // alt-left
      return this.editor.navigation.left(this, evt);
    } else if (alt && keyCode === 39) {
      // alt-right
      return this.editor.navigation.right(this, evt);
    } else if (alt && keyCode === 40) {
      // alt-down
      return this.editor.navigation.down(this, evt);
    }

    this.editor.printKeydown(evt);
  }
  
  // #TODO: remove indirections, but keep live programming
  static getAppropriateNode(babelASTNode) {
    return getAppropriateNode(babelASTNode);
  }
  getAppropriateNode(babelASTNode) {
    return AbstractAstNode.getAppropriateNode(babelASTNode);
  }
  getAppropriateElement(babelASTNode) {
    return AbstractAstNode.getAppropriateNode(babelASTNode);
  }
  
  get node() { return this._node; }
  set node(value) { return this._node = value; }

  get astNode() { return this._node; }
  set astNode(value) { return this._node = value; }

  async setPath(path) {
    this.path = path;
    this.node = path.node;
    
    await this.setNode(path.node);
  }
  
  async setNode(babelASTNode) {
    this.node = babelASTNode;

    await this.updateProjection(babelASTNode);
    
    return this;
  }
  
  async createSubElementForPath(astPath, slotName) {
    const subElement = await this.getAppropriateNode(astPath);
    await subElement.setPath(astPath);

    subElement.slot= slotName;
    subElement.setAttribute('slot', slotName);

    this.appendChild(subElement);
  }
  
  async createSubtreeForNode(astNode, slotName) {
    const subElement = await this.getAppropriateNode(astNode);
    await subElement.setNode(astNode);

    subElement.slot= slotName;
    subElement.setAttribute('slot', slotName);

    this.appendChild(subElement);
  }
  
  async createSubElementForPaths(paths, slotName) {
    for (let path of paths) {
      await this.createSubElementForPath(path, slotName);
    }
  }
  
  async createSubtreeForNodes(astNodes, slotName) {
    for (let astNode of astNodes) {
      await this.createSubtreeForNode(astNode, slotName);
    }
  }
  
  get editor() {
    return this._editor = this._editor || lively.allParents(this, [], true).find(ele => ele.localName === 'pen-editor');
  }

  /* Lively-specific API */
  livelyPreMigrate() {}
  livelyMigrate(other) {
    this.setPath(other.path)
  }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}

}
