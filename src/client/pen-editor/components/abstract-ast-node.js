"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

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

export default class AbstractAstNode extends Morph {
  async initialize() {
    this.windowTitle = "AbstractAstNode";
  }

  // #TODO: remove indirections, but keep live programming
  static getAppropriateNode(babelASTNode) {
    return getAppropriateNode(babelASTNode);
  }
  getAppropriateNode(babelASTNode) {
    return AbstractAstNode.getAppropriateNode(babelASTNode);
  }
  
  get editor() {
    return lively.allParents(this, [], true).find(ele => ele.localName === 'pen-editor');
  }
}