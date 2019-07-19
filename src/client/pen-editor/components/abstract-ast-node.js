"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import Keys from 'src/client/keys.js';

async function getAppropriateNode(babelASTNode) {
  if (!babelASTNode) {
    return <generic-ast-node></generic-ast-node>;
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

  return <generic-ast-node></generic-ast-node>;
}

// #TODO: not ideal live programming :(
function onMouseOver(evt) {
  evt.stopPropagation();
  this.classList.add('node-hover');
}
function onMouseOut(evt) {
  this.classList.remove('node-hover');
}
function onClick(evt) {
  evt.stopPropagation();
  lively.warn('foo4')
  // this.classList.toggle('selected');
}
function onKeydown(evt) {
  const { char, ctrl, shift, alt, keyCode, charCode } = Keys.keyInfo(evt);

  function selectNode() {
    
  }
  function navigateNextInList(me, editor, linearizedNodeList) {
    const currentNode = linearizedNodeList.find(n => n.uuid && (n.uuid === me.astNode.uuid));
    const newIndex = linearizedNodeList.indexOf(currentNode) + 1;
    if (linearizedNodeList[newIndex]) {
      let target;
      editor.querySelectorAll('*').forEach(element => {
        if (element.astNode === linearizedNodeList[newIndex]) {
          target = element;
        }
      });
      if (target) {
        target.focus();
      } else {
        lively.warn('no target found')
      }
    } else {
      lively.warn('reached end of list')
    }
  }
  if (alt && keyCode === 38) {
    // Alt-up
    if (
      this.parentElement && this.parentElement.localName.includes('ast-node')
    ) {
      evt.stopPropagation();
      evt.preventDefault();
      this.parentElement.focus()
    }
    return;
  } else if (alt && keyCode === 37) {
    // alt-left
    evt.stopPropagation();
    evt.preventDefault();
    
    function reversedEnterList(ast) {
      const linearizedNodeList = [];
      ast.traverseAsAST({
        enter(path) {
          linearizedNodeList.push(path.node);
        }
      });
      return linearizedNodeList.reverse();
    }

    const linearizedNodeList = reversedEnterList(this.editor.history.current());
    navigateNextInList(this, this.editor, linearizedNodeList);
    return;
  } else if (alt && keyCode === 39) {
    // alt-right
    evt.stopPropagation();
    evt.preventDefault();

    function exitList(ast) {
      const linearizedNodeList = [];
      ast.traverseAsAST({
        exit(path) {
          linearizedNodeList.push(path.node);
        }
      });
      return linearizedNodeList;
    }
    
    const linearizedNodeList = exitList(this.editor.history.current());
    navigateNextInList(this, this.editor, linearizedNodeList);
    return;
  } else if (alt && keyCode === 40) {
    // alt-down
    evt.stopPropagation();
    evt.preventDefault();

    let childToSelect;
    this.editor.history.current().traverseAsAST({
      enter: path => {
        if (path.node === this.astNode) {
          path.traverse({
            enter(path) {
              childToSelect = childToSelect || path.node;
            }
          });
        }
      }
    });
    return linearizedNodeList.reverse();

    return;
  }

  lively.success(`${char} (${keyCode}, ${charCode})[${ctrl ? 'ctrl' : ''}, ${shift ? 'shift' : ''}, ${alt ? 'alt' : ''}]`, this.astNode && this.astNode.type);
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
    this.addEventListener('blur', evt => { lively.notify('blur', this.astNode.type); });
    this.addEventListener('focus', evt => { lively.notify('focus', this.astNode.type); });
    this.addEventListener('focusin', evt => { lively.notify('focusin', this.astNode.type); });
    this.addEventListener('focusout', evt => { lively.notify('focusout', this.astNode.type); });
  }
  
  initHover() {
    this.addEventListener('mouseover', evt => this.onMouseOver(evt));
    this.addEventListener('mouseout', evt => this.onMouseOut(evt));
  }

  onMouseOver(evt) {
    onMouseOver.call(this, evt);
  }
  onMouseOut(evt) {
    onMouseOut.call(this, evt);
  }
  onClick(evt) {
  lively.warn('bar5')
    onClick.call(this, evt);
  }
  onKeydown(evt) {
    onKeydown.call(this, evt);
  }
  
  // #TODO: remove indirections, but keep live programming
  static getAppropriateNode(babelASTNode) {
    return getAppropriateNode(babelASTNode);
  }
  getAppropriateNode(babelASTNode) {
    return AbstractAstNode.getAppropriateNode(babelASTNode);
  }
  
  async createSubtreeForNode(astNode, slotName) {
    const subNode = await this.getAppropriateNode(astNode);
    await subNode.setNode(astNode);

    subNode.slot= slotName;
    subNode.setAttribute('slot', slotName);

    this.appendChild(subNode);
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
    this.setNode(other.astNode)
  }
  livelyInspect(contentNode, inspector) {}
  livelyPrepareSave() {}
  async livelyExample() {}

}

// self.AstNodeTypes = self.AstNodeTypes || [];
// lively.notify(self.AstNodeTypes.length);
// self.AstNodeTypes.forEach(type => {
//   type.__proto__ = AbstractAstNode;
// });
