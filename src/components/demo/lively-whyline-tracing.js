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
    this.traceRoot.order = 0;
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
  
  /*
   * Externally visible tracing functions
   */
  
  val(id, value) {
    const traceNode = this.begin(id);
    this.end(traceNode);
    return traceNode.value = value;
  }
  
  exp(id, exp) {
    const traceNode = this.begin(id);
    const value = traceNode.value = exp();
    this.end(traceNode);
    return value;
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
  
  func(id, args) {
    const traceNode = this.begin(id);
    traceNode.setVariableValues(args);
  }
  
  rtrn(id, exp) {
    const traceNode = this.begin(id);
    const value = traceNode.value = exp();
    let parent = traceNode;
    while (!parent.isFunction) {
      this.end(parent);
      parent = parent.parent;
    }
    this.end(parent);
    return parent.value = value;
  }
  
  iter() {
    
  }
  
  stmt(id) {
    this.begin(id);
  }
  
  end(traceNode = this.parentNode) {
    this.previousNode = traceNode.end(this.previousNode);
    this.parentNode = traceNode.parent;
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
    this.order = previous.order + 1;
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
  
  get traceId() { return this.astNode.traceid }
  get assignmentTargets() { return this.astNode.assignmentTargets }
  
  /*
   * Tree Navigation
   */
  
  functionParent() {
    return this.findParent((node) => node.isFunction);
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
  
  get preceedsChildren() { return true }
  
  /*
   * Control Flow
   */
  
  get branchesControlFlow() { return false }
  
  previousControlFlow(){
    return this.findParent((parent) => {
      return parent.branchesControlFlow;
    });
  }
  
  isBefore(other) {
    return this.order < other.order
  }
  
  isAfter(other) {
    return this.order > other.order
  }
  
  /*
   * Data Flow
   */
    
  previousAssignmentTo(identifier) {
    return this.findPredecessor((pred) => {
      return pred.assigns(identifier);
    });
  }
  
  variablesOfInterest() {
    const variables = new Set;
    this.collectVariablesOfInterest(variables);
    variables.delete(null);
    return [...variables];
  }
  
  collectVariablesOfInterest(variables) { }
  
  collectAssignmentTargets(variables) {
    this.assignmentTargets.forEach((id) => {
      variables.add(this.scope.variableNamed(id));
    })
  }
  
  assigns(identifier) {
    return false;
  }
  
  get readsVariable() { return false }
  get writesVariable() { return false }
  
  get scope() {
    return this._scope || (this._scope = this.getScope());
  }
  
  getScope() {
    return this.findParent((node) => node.isScope);
  }
  
  /*
   * Sub-Types
   */
  
  static mapToNodeType(astNode) {
    let nodeTypes = [
      VariableExpressionNode,
      LiteralExpressionNode, //group
      
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
      NewExpressionNode,
      ConditionalExpressionNode,
      ExpressionNode, //group
      
      WhileStatementNode,
      DoWhileStatementNode,
      
      IfStatementNode,
      VariableDeclarationNode,
      
      ProgramNode,
      ForStatementNode,
      BlockNode,
      FunctionNode //group
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
  
  get isFunction() { return false }
  get isScope() { return false }
  
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

class ExpressionNode extends TraceNode {
  static get astTypes() { return ['Expression'] }
  
  get preceedsChildren() { return false }
  
  valueString() {
    return this.toDisplayString(this.value);
  }
  
  labelString() {
    return '';
  }
  
  collectVariablesOfInterest(variables) {
    this.children.forEach((node) => node.collectVariablesOfInterest(variables));
  }
}

class BinaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['BinaryExpression', 'LogicalExpression'] }
  
  get left() { return this.children[0] }
  get right() { return this.children[1] }
    
  labelString() {
    let op = this.astNode.operator;
    let left = this.left.valueString();
    let right = this.right.valueString();
    return `${left} ${op} ${right}`;
  }
}

class UnaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['UnaryExpression'] }
  
  get argument() { return this.children[0] }
  
  labelString() {
    return this.astNode.operator;
  }
}

class MemberExpressionNode extends ExpressionNode {
  static get astTypes() { return ['MemberExpression'] }
  
  get computed() { return this.astNode.computed }
  get object() { return this.children[0] }
  get property() { return this.computed ? this.children[1].value : this.astNode.property.name }
  
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
    
  get function() { return this.children[0].value }
  get numArgs() { return this.children.length - (this.functionIsTraced() ? 2 : 1) }
  get arguments() { return this.children.slice(1, this.numArgs + 1) }
  get lastChild() { return this.children[this.children.length - 1] }
  get call() { return this.functionIsTraced() ? this.lastChild : null }
  get branchesControlFlow() { return true }
  
  functionIsTraced() {
    return this.lastChild.isFunction;
  }
  
  collectVariablesOfInterest(variables) {
    this.arguments.forEach((node) => node.collectVariablesOfInterest(variables));
    if (this.call) this.call.collectVariablesOfInterest(variables);
  }
  
  labelString() {
    let name = this.function.name || this.function.property;
    if (typeof(name) != 'string') name = 'f';
    let argString = this.arguments.map((expNode) => {
      return expNode.valueString();
    }).join(',');
    return `${name}(${argString}) -> ${this.valueString()}`;
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

class NewExpressionNode extends ExpressionNode {
  static get astTypes() { return ['NewExpression'] }
  
  labelString() {
    return ` new ${this.valueString()}`; //there's probably something better to do here
  }
}

class ConditionalExpressionNode extends ExpressionNode {
  static get astTypes() { return ['ConditionalExpression'] }
  
  get branchesControlFlow() { return true }
  get test() { return this.children[0] }
  
  labelString() {
    return `${this.toDisplayString(!!this.test.value)} -> ${this.valueString()}`;
  }
}

class ReturnNode extends ExpressionNode {
  static get astTypes() { return ['ReturnStatement'] }
  
  get argument() { return this.children[0] }
  
  hasArgument() {
    return this.astNode.argument !== null;
  }
  
  labelString() {
    return this.hasArgument() ? `return ${this.valueString()}` : 'return';
  }
}

class IfStatementNode extends TraceNode {
  static get astTypes() { return ['IfStatement'] }
  
  get test() { return this.children[0] }
  get consequences() { return this.children.slice(1, this.children.length) }
  get branchesControlFlow() { return true }
  
  labelString() {
    return `if (${this.test.labelString()}) -> ${this.test.valueString()}`;
  }
  
  collectVariablesOfInterest(variables) {
    this.test.collectVariablesOfInterest(variables);
  }
}

class WhileStatementNode extends TraceNode {
  static get astTypes() { return ['WhileStatement'] }
  get branchesControlFlow() { return true }
  
  labelString() {
    return 'while{}'
  }
}

class DoWhileStatementNode extends TraceNode {
  static get astTypes() { return ['DoWhileStatement'] }
  get branchesControlFlow() { return true }
  
  labelString() {
    return 'do{}while'
  }
}

class VariableDeclarationNode extends TraceNode {
  static get astTypes() { return ['VariableDeclaration'] }
  get kind() { return this.astNode.kind; }
  
  get assignmentTargets() {
    return this.children.reduce((vars, declarator) => {
      return vars.concat(declarator.assignmentTargets);
    }, []);
  }
  
  collectVariablesOfInterest(variables) {
    this.collectAssignmentTargets(variables);
  }
  
  labelString() {
    const vars = this.assignmentTargets.map((id) => id.name).join(", ");
    return `${this.astNode.kind} ${vars}`;
  }
}

class LiteralExpressionNode extends ExpressionNode {
  static get astTypes() { return ['Literal'] }
  
  labelString() {
    return this.valueString();
  }
}

/*
 * Variable Changes
 */

class VariableExpressionNode extends ExpressionNode {
  static get astTypes() { return ['Identifier'] }
  get readsVariable() { return true }
  get variable() { return this.scope.variableNamed(this.astNode.name) }
  
  end(...args) {
    const variable = this.variable;
    if (variable) variable.log(this); //todo: trace declarations, check against javascript globals
    return super.end(...args);
  }
  
  labelString() {
    return this.astNode.name;
  }
  
  collectVariablesOfInterest(variables) {
    variables.add(this.variable);
  }
}

class DeclaratorNode extends ExpressionNode {
  static get astTypes() { return ['VariableDeclarator'] }
  get init() { return this.children[0] }
  get declaration() { return this.parent; }
  get kind() { return this.declaration.kind; }
  get writesVariable() { return true }
  
  setVariableValues(...args) {
    super.setVariableValues(...args);
    this.assignmentTargets.forEach((id) => {
      this.scope.declareVariable(id.name, this, this.kind);
    })
  }
  
  assigns(identifier) {
    return this.assignmentTargets.some((id) => {
      return equalIdentifiers(id, identifier);
    });
  }
  
  collectVariablesOfInterest(variables) {
    this.collectAssignmentTargets(variables);
    this.children.forEach((node) => node.collectVariablesOfInterest(variables));
  }
  
  labelString() {
    return this.astNode.init ? this.assignmentsString() : this.astNode.id.name;
  }
}

class AssignmentExpressionNode extends ExpressionNode {
  static get astTypes() { return ['AssignmentExpression'] }
  
  get left() { return this.astNode.left }
  get right() { return this.children[0] }
  get identifiers() { 
    return this.assignmentTargets.filter((node) => t.isIdentifier(node));
  }
  get writesVariable() { return true }
  
  end(...args) {
    this.identifiers.forEach((id) => {
      this.scope.variableNamed(id.name).log(this);
    })
    return super.end(...args);
  }
  
  collectVariablesOfInterest(variables) {
    this.identifiers.forEach((id) => variables.add(this.scope.variableNamed(id.name)));
    this.right.collectVariablesOfInterest(variables);
  }
  
  assigns(identifier) {
    return this.assignmentTargets.some((id) => {
      return equalIdentifiers(id, identifier);
    });
  }
  
  labelString() {
    return this.assignmentsString();
  }
}

class UpdateExpressionNode extends ExpressionNode { //subclass AssignmentExpressionNode?
  static get astTypes() { return ['UpdateExpression'] }
  
  get identifier() {
    if (t.isIdentifier(this.argument)) {
      return this.argument;
    } else {
      return this.argument.identifier; //argument might not to be an identifier
    }
  }
  get argument() { return this.astNode.argument }
  get writesVariable() { return true }
  get readsVariable() { return true }
  
  end(...args) {
    this.scope.variableNamed(this.identifier.name).log(this);
    return super.end(...args);
  }
  
  labelString() {
    return `${this.argument.name} = ${this.valueString()}`;
  }
  
  collectVariablesOfInterest(variables) {
    variables.add(this.scope.variableNamed(this.identifier.name));
    this.children.forEach((node) => node.collectVariablesOfInterest(variables));
  }
  
  assigns(identifier) {
    return equalIdentifiers(this.identifier, identifier);
  }
}

/*
 * Scopes
 */

class ScopeNode extends TraceNode {
  constructor(...args) {
    super(...args);
    this.variables = {};
  }
  
  get isScope() { return true }
  
  declareVariable(name, sourceNode, kind) {
    this.variables[name] = new Variable(name, sourceNode, kind);
  }
  
  variableNamed(name) {
    const variable = this.variables[name];
    if (variable) {
      return this.variables[name];
    } else {
      const scope = this.scope;
      return scope ? scope.variableNamed(name) : null;
    }
  }
}

class ProgramNode extends ScopeNode {
  static get astTypes() { return ['Program'] }
  get branchesControlFlow() { return true } //might be seen as either
  
}

class BlockNode extends ScopeNode {
  static get astTypes() { return ['BlockStatement'] }
  
  labelString() {
    return ''
  }
}

class ForStatementNode extends ScopeNode {
  static get astTypes() { return ['ForStatement'] }
  
  get branchesControlFlow() { return true }
  
  labelString() {
    return 'for{}'
  }
}

class FunctionNode extends ScopeNode {
  static get astTypes() { return ['Function'] }
  
  //getScope() {  } //todo: function's scope is set during its creation
  get branchesControlFlow() { return true }
  get isFunction() { return true }
  
  setVariableValues(...args) {
    super.setVariableValues(...args);
    this.assignmentTargets.forEach((id) => {
      this.declareVariable(id.name, this, "param");
    })
  }
  
  collectVariablesOfInterest(variables) {
    this.collectAssignmentTargets(variables);
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

/*
 * state
 */

class Variable {
  constructor(name, source, kind) {
    this.name = name;
    this.history = [source];
    this.type = kind; //var, let, const, param
  }
  
  log(traceNode) {
    this.history.push(traceNode);
  }
  
  indexBefore(traceNode) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const node = this.history[i];
      if (traceNode.isAfter(node)) return i;
    }
    return -1;
  }
  
  indexAfter(traceNode) {
    for (let i = 0; i < this.history.length; i++) {
      const node = this.history[i];
      if (traceNode.isBefore(node)) return i;
    }
    return this.history.length;
  }
  
  findBefore(tester, traceNode) {
    let i = this.indexBefore(traceNode);
    while (i >= 0) {
      const node = this.history[i--];
      if (tester(node)) return node;
    }
    return null;
  }
  
  findAfter(tester, traceNode) {
    let i = this.indexAfter(traceNode);
    while (i < this.history.length) {
      const node = this.history[i++];
      if (tester(node)) return node;
    }
    return null;
  }
  
  writeBefore(traceNode) {
    return this.findBefore((node) => node.writesVariable, traceNode);
  }
  
  writeAfter(traceNode) {
    return this.findAfter((node) => node.writesVariable, traceNode);
  }
  
  readBefore(traceNode) {
    return this.findBefore((node) => node.readsVariable, traceNode);
  }
  
  readAfter(traceNode) {
    return this.findAfter((node) => node.readsVariable, traceNode);
  }
  
  readOrWriteBefore(traceNode) {
    return this.findBefore((node) => true, traceNode);
  }
  
  readOrWriteAfter(traceNode) {
    return this.findAfter((node) => true, traceNode);
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