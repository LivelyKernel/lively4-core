import systemBabel from 'systemjs-babel-build';
const { types: t, template, traverse } = systemBabel.babel;

export class ExecutionTrace {
  constructor(astRootNode){
    this.astRoot = astRootNode;
    this.nodeMap = astRootNode.node_map;
    this.traceRoot = this.newTraceNode(astRootNode.traceid);
    this.parentNode = this.traceRoot;
    this.previousNode = this.traceRoot;
    this.lastOccurrenceMap = [];
  }
  
  newTraceNode(astNodeId) {
    let astNode = this.nodeMap[astNodeId];
    return new astNode.traceNodeType(astNode);
  }
  
  addOccurrence(id, traceNode) {
    const last = this.lastOccurrenceMap[id];
    if (last) {
      traceNode.previousOccurrence = last;
      last.nextOccurrence = traceNode;
    }
    this.lastOccurrenceMap[id] = traceNode;
  }
  
  begin(id) {
    const traceNode = this.newTraceNode(id);
    this.parentNode.addChild(traceNode);
    this.previousNode = traceNode.begin(this.previousNode);
    this.addOccurrence(id, traceNode);
    return this.parentNode = traceNode;
  }
  
  end(traceNode = this.parentNode) {
    this.previousNode = traceNode.end(this.previousNode);
    this.parentNode = traceNode.parent;
  }
  
  /*
   * Externally visible tracing functions
   */
  
  exp(id, exp) {
    const traceNode = this.begin(id);
    const value = traceNode.value = exp();
    this.end(traceNode);
    return value;
  }
  
  val(id, value) {
    const traceNode = this.begin(id);
    this.end(traceNode);
    return traceNode.value = value;
  }
  
  func(id, args) {
    const traceNode = this.begin(id);
    traceNode.setVariableValues(args);
  }
  
  asgn(id, exp, argFunc) {
    const traceNode = this.begin(id);
    const value = traceNode.value = exp();
    traceNode.setVariableValues(argFunc());
    this.end(traceNode);
    return value;
  }
  
  decl(id, args) {
    const declarator = this.parentNode.descendantWithId(id);
    declarator.setVariableValues(args);
  }
  
  stmt(id) {
    this.begin(id);
  }
  
  rtrn(id, exp) {
    const traceNode = this.begin(id);
    const value = traceNode.value = exp();
    let parent = traceNode;
    while (!parent.isFunction()) {
      this.end(parent);
      parent = traceNode.parent;
    }
    this.end(parent);
    return parent.value = value;
  }
}

export class TraceNode {
  constructor(astNode){
    this.children = [];
    this.astNode = astNode;
  }
  
  /*
   * Tracing
   */
  
  setPredecessor(previous) {
    this.predecessor = previous;
    previous.successor = this;
  }
  
  begin(previous) {
    if (this.preceedsChildren){
      this.setPredecessor(previous);
      return this;
    } else {
      return previous;
    }
  }
  
  end(previous) {
    if (this.preceedsChildren){
      return previous;
    } else {
      this.setPredecessor(previous);
      return this;
    }
  }
  
  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }
  
  setVariableValues(values) {
    this.variableValues = this.assignmentTargets.map((node, i) => {
      if (t.isIdentifier(node)) {
        return values[i];
      } else { //node is MemberExpression
        const object = this.descendantWithId(node.object.traceid).value;
        const property = node.computed ? this.descendantWithId(node.property.traceid).value : node.property.name;
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
  
  descendantWithId(traceId) {
    return this.findDescendant((node) => node.traceId == traceId);
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
  
  findDescendant(tester) {
    //find (BFS) a descendant for which `tester` evaluates to true
    //returns `null` if no such node was found
    const parents = [this];
    while (parents.length > 0) {
      const children = parents.shift().children;
      const child = children.find(tester);
      if (child) return child;
      parents.push(...children);
    }
    return null;
  }
  
  findSuccessor(tester) {
    //find first successor for which `tester` evaluates to true
    //returns `null` if no such node was found
    let node = this;
    do {
      node = node.successor;
    } while (node && !tester(node));
    return node || null;
  }
  
  findPredecessor(tester) {
    //find first predecessor for which `tester` evaluates to true
    //returns `null` if no such node was found
    let node = this;
    do {
      node = node.predecessor;
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
    return nodes.reduce((vars, node) => {
      return vars.concat(node.variablesOfInterest());
    }, []);
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
      
      VariableExpressionNode,
      LiteralExpressionNode, //catch all
      
      BinaryExpressionNode,
      UnaryExpressionNode,
      UpdateExpressionNode,
      ObjectExpressionNode,
      ArrayExpressionNode,
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
    if (Array.isArray(value)) {
      let str = value.toString();
      if (str.length > maxLength) {
        str = str.substr(0, maxLength+2) + "...";
      }
      return `[${str}]`;
    }
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
    }    
    return value.toString();
  }
  
  labelString() {
    return this.astNode.type;
  }
  
  reconstructMemberExpression(astNode) {
    const object = this.descendantWithId(astNode.object.traceid).valueString();
    if (astNode.computed) {
      const property = this.descendantWithId(astNode.property.traceid).valueString();
      return `${object}[${property}]`;
    } else {
      const property = astNode.property.name;
      return `${object}.${property}`
    }
  }
  
  assignmentsString() {
    const assignments = this.assignmentTargets.map((left, index) => {
      const name = t.isIdentifier(left)
                    ? left.name
                    : this.reconstructMemberExpression(left);
      const value = this.toDisplayString(this.variableValues[index]);
      return `${name} = ${value}`;
    });
    return assignments.join(", ");
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
    return this.assignmentsString();
  }
  
  variablesOfInterest() {
    return (this.assignmentTargets
            .filter((node) => t.isIdentifier(node))
            .concat(this.right.variablesOfInterest()));
  }
  
  assigns(identifier) {
    return this.assignmentTargets.some((id) => {
      return equalIdentifiers(id, identifier);
    });
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
  
  variablesOfInterest() {
    const allButFunction = this.children.slice(0, this.numArgs + 1);
    return this.variablesOfInterestFor(allButFunction);
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

class VariableExpressionNode extends ExpressionNode {
  static get astTypes() { return ['Identifier'] }
  
  labelString() {
    return this.astNode.name;
  }
  
  variablesOfInterest() {
    return [this.astNode];
  }
}

class LiteralExpressionNode extends ExpressionNode {
  static get astTypes() { return ['Literal'] }
  
  labelString() {
    return this.valueString();
  }
}

class ObjectExpressionNode extends ExpressionNode {
  static get astTypes() { return ['ObjectExpression'] }
  
  labelString() {
    return this.valueString();
  }
}

class ArrayExpressionNode extends ExpressionNode {
  static get astTypes() { return ['ArrayExpression'] }
  
  labelString() {
    return this.valueString();
  }
}

class DeclaratorNode extends ExpressionNode {
  static get astTypes() { return ['VariableDeclarator'] }
  
  get init() {
    return this.children[0];
  }
  
  assigns(identifier) {
    return this.assignmentTargets.some((id) => {
      return equalIdentifiers(id, identifier);
    });
  }
  
  variablesOfInterest() {
    return this.assignmentTargets.concat(this.variablesOfInterestFor(this.children));
  }
  
  labelString() {
    return this.assignmentsString();
  }
}

class ReturnNode extends ExpressionNode {
  static get astTypes() { return ['ReturnStatement'] }
  
  get argument() {
    return this.children[0];
  }
  
  hasArgument() {
    return this.astNode.argument !== null;
  }
  
  labelString() {
    return this.hasArgument() ? `return ${this.valueString()}` : 'return';
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
  
  isFunction() {
    return true;
  }
  
  variablesOfInterest() {
    return this.assignmentTargets;
  }
  
  assigns(identifier) {
    return this.assignmentTargets.some((id) => {
      return equalIdentifiers(id, identifier);
    });
  }
  
  labelString() {
    return `Function(${this.assignmentsString()})`;
  }
}

class VariableDeclarationNode extends TraceNode {
  static get astTypes() { return ['VariableDeclaration'] }
  
  get assignmentTargets() {
    return this.children.reduce((vars, declarator) => {
      return vars.concat(declarator.assignmentTargets);
    }, []);
  }
  
  variablesOfInterest() {
    return this.assignmentTargets;
  }
  
  labelString() {
    const vars = this.assignmentTargets.map((id) => id.name).join(", ");
    return `${this.astNode.kind} ${vars}`;
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