import systemBabel from 'systemjs-babel-build';
const { types: t, template, traverse } = systemBabel.babel;

export class ExecutionTrace {
  constructor(astRootNode){
    this.astRoot = astRootNode;
    this.nodeMap = astRootNode.node_map;
    this.traceRoot = this.newTraceNode(astRootNode.traceid);
    this.parentNode = this.traceRoot;
  }
  
  newTraceNode(astNodeId) {
    let astNode = this.nodeMap[astNodeId];
    return this.previousNode = new astNode.traceNodeType(astNode, this.parentNode);
  }
  
  /*
   * Externally visible tracing functions
   */
  
  exp(id, exp) {
    const traceNode = this.parentNode = this.newTraceNode(id);
    const value = traceNode.value = exp();
    this.parentNode = traceNode.parent;
    return value;
  }
  
  val(id, value) {
    return this.newTraceNode(id).value = value;
  }
  
  func(id, args) {
    const traceNode = this.parentNode = this.newTraceNode(id);
    traceNode.setVariableValues(args);
  }
  
  asgn(id, exp, argFunc) {
    const traceNode = this.parentNode = this.newTraceNode(id);
    const value = traceNode.value = exp();
    traceNode.setVariableValues(argFunc());
    this.parentNode = traceNode.parent;
    return value;
  }
  
  decl(id, args) {
    const declarator = this.parentNode.successorWithId(id);
    declarator.setVariableValues(args);
  }
  
  stmt(id) {
    this.parentNode = this.newTraceNode(id);
  }
  
  rtrn(id, exp) {
    const traceNode = this.parentNode = this.newTraceNode(id);
    const value = traceNode.value = exp();
    const functionParent = traceNode.functionParent();
    this.parentNode = functionParent.parent;
    return functionParent.value = value;
  }
  
  end() {
    this.parentNode = this.parentNode.parent;
  }
}

export class TraceNode {
  constructor(astNode, parent){
    this.children = [];
    this.astNode = astNode;
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
  }
  
  /*
   * Tracing
   */
  setVariableValues(values) {
    this.variableValues = this.assignmentTargets.map((node, i) => {
      if (t.isIdentifier(node)) {
        return values[i];
      } else { //node is MemberExpression
        const object = this.predecessorWithId(node.object.traceid).value;
        const property = node.computed ? this.predecessorWithId(node.property.traceid).value : node.property.name;
        return object[property];
      }
    });
  }
  
  get traceId() {
    return this.astNode.traceid;
  }
  
  get assignmentTargets() {
    return this.astNode.assignmentTargets;
  }
  
  /*
   * Tree Navigation
   */
  
  functionParent() {
    return this.findParent((node) => node.isFunction());
  }
  
  successorWithId(traceId) {
    return this.findSuccessor((node) => node.traceId == traceId);
  }
  
  predecessorWithId(traceId) {
    return this.findPredecessor((node) => node.traceId == traceId);
  }
  
  parentWithId(traceId) {
    return this.findParent((node) => node.traceId == traceId);
  }
  
  findSuccessor(tester) {
    //find first successor for which `tester` evaluates to true
    //returns `null` if no such node was found
    let node = this;
    do {
      node = node.successor();
    } while (node && !tester(node));
    return node || null;
  }
  
  findPredecessor(tester) {
    //find first predecessor for which `tester` evaluates to true
    //returns `null` if no such node was found
    let node = this;
    do {
      node = node.predecessor();
    } while (node && !tester(node));
    return node || null;
  }
  
  findParent(tester) {
    //find first parent for which `tester` evaluates to true
    //returns `null` if no such node was found
    let node = this;
    do {
      node = node.parent;
    } while (node && !tester(node));
    return node || null;
  }
  
  get preceedsChildren() {
    return true;
  }
  
  precedingChildren() {
    return this.preceedsChildren ? [] : this.children;
  }
  
  succeedingChildren() {
    return this.preceedsChildren ? this.children : [];
  }
  
  firstDescendant() {
    let children = this.precedingChildren();
    if (children.length == 0) {
      return this;
    } else {
      return children[0].firstDescendant();
    }
  }
  
  lastDescendant() {
    let children = this.succeedingChildren();
    if (children.length == 0) {
      return this;
    } else {
      return children[children.length-1].lastDescendant();
    }
  }
  
  precedingChildAround(traceNode, offset) {
    let children = this.precedingChildren();
    let index = children.indexOf(traceNode);
    if (index >= 0) {
      if (index+offset == children.length) {
        return this;
      } else {
        return children[index+offset];
      }
    }
    return null;
  }
  
  succeedingChildAround(traceNode, offset) {
    let children = this.succeedingChildren();
    let index = children.indexOf(traceNode);
    if (index >= 0) {
      if (index+offset == -1) {
        return this;
      } else {
        return children[index+offset];
      }
    }
    return null;
  }
  
  descendantBefore(traceNode) {
    let child = this.precedingChildAround(traceNode, -1)
                || this.succeedingChildAround(traceNode, -1);
    if (child === this) return this;
    if (!child) return this.parent.descendantBefore(this);
    return child.lastDescendant();
  }
  
  descendantAfter(traceNode) {
    let child = this.precedingChildAround(traceNode, 1)
                || this.succeedingChildAround(traceNode, 1);
    if (child === this) return this;
    if (!child) return this.parent.descendantAfter(this);
    return child.firstDescendant();
  }
  
  predecessor() {
    let children = this.precedingChildren();
    let child = children[children.length-1];
    if (child) {
      return child.lastDescendant();
    } else if (this.parent) {
      return this.parent.descendantBefore(this);
    } else {
      return null;
    }
  }
  
  successor() {
    let children = this.succeedingChildren();
    let child = children[0];
    if (child) {
      return child.firstDescendant();
    } else if (this.parent) {
      return this.parent.descendantAfter(this);
    } else {
      return null;
    }
  }
  
  /*
   * Control Flow
   */
  
  branchesControlFlow() {
    return false;
  }
  
  previousControlFlow(){
    return this.findParent((parent) => {
      return parent.branchesControlFlow();
    });
  }
  
  /*
   * Data Flow
   */
    
  previousAssignmentTo(identifier) {
    return this.findPredecessor((pred) => {
      return pred.assigns(identifier);
    });
  }
  
  variablesOfInterestFor(nodes) {
    let identifiers = [];
    nodes.forEach((child) => {
      identifiers.push(...child.variablesOfInterest());
    })
    return identifiers;
  }
  
  variablesOfInterest() {
    return [];
  }
  
  assigns(identifier) {
    return false;
  }
  
  /*
   * Sub-Types
   */
  
  static mapToNodeType(astNode) {
    let nodeTypes = [
      ProgramNode,
      
      VariableAccessNode,
      LiteralAccessNode, //catch all
      
      BinaryExpressionNode,
      UnaryExpressionNode,
      UpdateExpressionNode,
      AssignmentExpressionNode,
      CallExpressionNode,
      MemberExpressionNode,
      DeclaratorNode,
      ReturnNode,
      ExpressionNode, //catch all      
      
      ForStatementNode,
      WhileStatementNode,
      DoWhileStatementNode,
      LoopNode, //catch all
      
      IfStatementNode,
      VariableDeclarationNode,
      
      FunctionNode //catch all
    ];
    let nodeType = nodeTypes.find((nodeType) => {
      return nodeType.mapsTo(astNode)
    });
    if (!nodeType) nodeType = this;
    return nodeType
  }
  
  static get astTypes() { return [] }
  
  static mapsTo(astNode) {
    return this.astTypes.some((astType) => {
      return t.isType(astNode.type, astType);
    })
  }
  
  isFunction() {
    return false;
  }
  
  /*
   * Display
   */
  
  toDisplayString(value, maxLength = 10) {
    if (value === null) return 'null';
    let str = '';
    let type = typeof(value);
    switch(type) {
      case 'undefined':
        return 'undefined';
      
      case 'object':
        return '{...}';
        
      case 'boolean':
        return value.toString();
        
      case 'function':
        return value.name || 'fn';
        
      case 'number':
        return value.toString();
        
      case 'string':
        str = value.substr(0, maxLength);
        if (value.length > maxLength) str += '...';
        str = `"${str}"`;
        return str;
        
      default:
        return value.toString();
     }
  }
  
  labelString() {
    return this.astNode.type;
  }
}

class ProgramNode extends TraceNode {
  static get astTypes() { return ['Program'] }
  
  branchesControlFlow() {
    return true;
  }
}

class ExpressionNode extends TraceNode {
  static get astTypes() { return ['Expression'] }
  
  get preceedsChildren() {
    return false;
  }
  
  valueString() {
    return this.toDisplayString(this.value);
  }
  
  labelString() {
    return '';
  }
  
  variablesOfInterest() {
    return this.variablesOfInterestFor(this.children);
  }
}

class BinaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['BinaryExpression', 'LogicalExpression'] }
  
  get left() {
    return this.children[0];
  }
  
  get right() {
    return this.children[1];
  }
    
  labelString() {
    let op = this.astNode.operator;
    let left = this.left.valueString();
    let right = this.right.valueString();
    return `${left} ${op} ${right}`;
  }
}

class UnaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['UnaryExpression'] }
  
  get argument() {
    return this.children[0];
  }
  
  labelString() {
    return this.astNode.operator;
  }
}

class UpdateExpressionNode extends ExpressionNode {
  static get astTypes() { return ['UpdateExpression'] }
  
  get identifier() {
    if (t.isIdentifier(this.argument)) {
      return this.argument;
    } else {
      return this.argument.identifier; //fix me, I might not to be an identifier
    }
  }
  
  get argument() {
    return this.astNode.argument;
  }
  
  labelString() {
    return `${this.argument.name} = ${this.valueString()}`;
  }
  
  variablesOfInterest() {
    return [this.identifier, ...this.variablesOfInterestFor(this.children)];
  }
  
  assigns(identifier) {
    return equalIdentifiers(this.identifier, identifier);
  }
}

class AssignmentExpressionNode extends ExpressionNode {
  static get astTypes() { return ['AssignmentExpression'] }
  
  get left() {
    return this.astNode.left;
  }
  
  get right() {
    return this.children[0];
  }
  
  labelString() {
    let name = this.left.name;
    if (!name && this.left.property)
      name = this.left.property.name;
    return `${name} = ${this.valueString()}`
  }
  
  variablesOfInterest() {
    return [this.left, ...this.right.variablesOfInterest()];
  }
  
  assigns(identifier) {
    return equalIdentifiers(this.left, identifier);
  }
}

class MemberExpressionNode extends ExpressionNode {
  static get astTypes() { return ['MemberExpression'] }
  
  get computed() {
    return this.astNode.computed;
  }
  
  get object() {
    return this.children[0];
  }
  
  get property() {
    return this.computed ? this.children[1].value : this.astNode.property.name;
  }
  
  labelString() {
    let object = this.object.valueString();
    let property = this.property;
    if (this.computed) {
      return `${object}[${this.toDisplayString(property)}]`
    } else {
      return `${object}.${property}`
    }
  }
}

class CallExpressionNode extends ExpressionNode {
  static get astTypes() { return ['CallExpression'] }
    
  get function() {
    return this.children[0].value;
  }
  
  get numArgs() {
    return this.children.length - (this.functionIsTraced() ? 2 : 1);
  }
  
  get arguments() {
    return this.children.slice(1, this.numArgs + 1);
  }
  
  lastChild() {
    return this.children[this.children.length - 1];
  }
  
  get call() {
    return this.functionIsTraced() ? this.lastChild() : null;
  }
  
  functionIsTraced() {
    return this.lastChild().isFunction();
  }
  
  branchesControlFlow() {
    return true;
  }
  
  labelString() {
    let name = this.function.name || this.function.property;
    if (typeof(name) != 'string') name = 'f';
    let argString = this.arguments.map((expNode) => {
      return expNode.valueString();
    }).join(',');
    return `${name}(${argString}) -> ${this.valueString()}`;
  }
  
  /*
  variablesOfInterest() {
    return this.variablesOfInterestFor(this.arguments);
  }
  */
}

class VariableAccessNode extends ExpressionNode {
  static get astTypes() { return ['Identifier'] }
  
  labelString() {
    return this.astNode.name;
  }
  
  variablesOfInterest() {
    return [this.astNode];
  }
}

class LiteralAccessNode extends ExpressionNode {
  static get astTypes() { return ['Literal'] }
  
  labelString() {
    return this.valueString();
  }
}

class DeclaratorNode extends ExpressionNode {
  static get astTypes() { return ['VariableDeclarator'] }
  
  get init() {
    return this.children[0];
  }
  
  labelString() {
    let varName = this.astNode.id.name;
    return `${varName} = ${this.valueString()}`;
  }
  
  assigns(identifier) {
    return equalIdentifiers(this.astNode.id, identifier);
  }
  
  variablesOfInterest() {
    console.log(this.astNode.left);
    return [this.astNode.id, ...this.variablesOfInterestFor(this.children)];
  }
}

class ReturnNode extends ExpressionNode {
  static get astTypes() { return ['ReturnStatement'] }
  
  get argument() {
    return this.children[0];
  }
  
  labelString() {
    return `return ${this.valueString()}`
  }
}

class IfStatementNode extends TraceNode {
  static get astTypes() { return ['IfStatement'] }
  
  get test() {
    return this.children[0];
  }
  
  get consequences() {
    return this.children.slice(1, this.children.length);
  }
  
  precedingChildren() {
    return [this.test];
  }
  
  succeedingChildren() {
    return this.consequences;
  }
  
  branchesControlFlow() {
    return true;
  }
  
  labelString() {
    return `if (${this.test.labelString()}) -> ${this.test.valueString()}`;
  }
  
  variablesOfInterest() {
    return this.test.variablesOfInterest();
  }
}

class LoopNode extends TraceNode {
  static get astTypes() { return ['Loop'] }
  
  branchesControlFlow() {
    return true;
  }
}

class ForStatementNode extends LoopNode {
  static get astTypes() { return ['ForStatement'] }
  
  labelString() {
    return 'for{}'
  }
}

class WhileStatementNode extends LoopNode {
  static get astTypes() { return ['WhileStatement'] }
  
  labelString() {
    return 'while{}'
  }
}

class DoWhileStatementNode extends LoopNode {
  static get astTypes() { return ['DoWhileStatement'] }
  
  labelString() {
    return 'do{}while'
  }
}

class FunctionNode extends TraceNode {
  static get astTypes() { return ['Function'] }
  
  branchesControlFlow() {
    return true;
  }
  
  labelString() {
    return 'Function';
  }
  
  isFunction() {
    return true;
  }
}

class VariableDeclarationNode extends TraceNode {
  static get astTypes() { return ['VariableDeclaration'] }
  
  labelString() {
    return this.astNode.kind;
  }
}

export function equalIdentifiers(identifier1, identifier2) {
  t.assertIdentifier(identifier1);
  t.assertIdentifier(identifier2);
  return (
    identifier1.name == identifier2.name
    && identifier1.scopeId == identifier2.scopeId)
}

window.lively4ExecutionTrace = ExecutionTrace