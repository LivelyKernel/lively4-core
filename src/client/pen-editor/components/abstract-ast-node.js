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
  
  if (babelASTNode.type === 'Identifier') {
    return <ast-node-identifier></ast-node-identifier>;
  }
  if (babelASTNode.type === 'Program') {
    return <ast-node-program></ast-node-program>;
  }
  if (babelASTNode.type === 'ExpressionStatement') {
    return <ast-node-expression-statement></ast-node-expression-statement>;
  }
  if (babelASTNode.type === 'VariableDeclaration') {
    return <ast-node-variable-declaration></ast-node-variable-declaration>;
  }
  if (babelASTNode.type === 'VariableDeclarator') {
    return <ast-node-variable-declarator></ast-node-variable-declarator>;
  }
  if (babelASTNode.type === 'CallExpression') {
    return <ast-node-call-expression></ast-node-call-expression>;
  }
  if (babelASTNode.type === 'ReturnStatement') {
    return <ast-node-return-statement></ast-node-return-statement>;
  }
  if (babelASTNode.type === 'AssignmentExpression') {
    return <ast-node-assignment-expression></ast-node-assignment-expression>;
  }
  if (babelASTNode.type === 'BinaryExpression') {
    return <ast-node-binary-expression></ast-node-binary-expression>;
  }
  if (babelASTNode.type === 'NumericLiteral') {
    return <ast-node-numeric-literal></ast-node-numeric-literal>;
  }
  if (babelASTNode.type === 'MemberExpression') {
    return <ast-node-member-expression></ast-node-member-expression>;
  }
  if (babelASTNode.type === 'ArrowFunctionExpression') {
    return <ast-node-arrow-function-expression></ast-node-arrow-function-expression>;
  }
  if (babelASTNode.type === 'BlockStatement') {
    return <ast-node-block-statement></ast-node-block-statement>;
  }

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
