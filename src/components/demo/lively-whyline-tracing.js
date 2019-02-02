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
    return new astNode.traceNodeType(astNode, this.parentNode);
  }
  
  exp(id, exp) {
    let traceNode = this.newTraceNode(id);
    this.parentNode = traceNode;
    let value = exp();
    traceNode.value = value;
    this.parentNode = traceNode.parent;
    return value;
  }
  
  val(id, value) {
    let traceNode = this.newTraceNode(id);
    return traceNode.value = value;
  }
  
  traceBeginNode(id) {
    this.parentNode = this.newTraceNode(id);
  }
  
  traceEndNode(id) {
    this.parentNode = this.parentNode.parent;
  }
}

export class TraceNode {
  constructor(astNode, parent){
    this.children = []
    this.astNode = astNode
    this.parent = parent
    if (this.parent) {
      this.parent.children.push(this)
    }
  }
  
  lastNode() {
    let numChildren = this.children.length
    if (numChildren > 0) {
      return this.children[numChildren - 1].lastNode()
    } else {
      return this
    }
  }
  
  nodeBeforeChild(traceNode) {
    let pos = this.children.indexOf(traceNode);
    if (pos < 1) {
      return this
    } else {
      return this.children[pos - 1].lastNode()
    }
  }
  
  predecessor() {
    if (this.parent) {
      return this.parent.nodeBeforeChild(this)
    } else {
      return undefined
    }
  }
  
  whyWasThisStatementExecuted(){
    if (this.parent){
      if (this.astNode.type == "FunctionDeclaration")
        return this.parent
      return this.parent.findLastControlFlow()
    }
  }

  findLastControlFlow(){
    let branchingASTNodeTypes = ['FunctionDeclaration', 'IfStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement']
    if (branchingASTNodeTypes.includes(this.astNode.type) || !this.parent) {
      return this
    }
    return this.parent.findLastControlFlow()
  }
    
  findLastDataFlowOf(identifier) {
    let pred = this;
    do {
      pred = pred.predecessor();
    } while (pred && !pred.assigns(identifier))
    return pred;
  }
  
  questions() {
    let questions = [
      ['Back', () => this.predecessor()],
      ['Up', () => this.whyWasThisStatementExecuted()]]
    let referencedVars = this.variablesOfInterest()
                          .sort((a, b) => {
                            return a.name.localeCompare(b.name)
                          })
                          .filter((id, i, arr) => {
                            let pred = arr[i-1]
                            return !pred 
                                    || id.name != pred.name
                                    || id.scopeId != pred.scopeId //shouldn't actually differ
                          })
    referencedVars.forEach((id) => {
      questions.push([`Previous assignment of '${id.name}'`, () => this.findLastDataFlowOf(id)])
    })
    return questions
  }
  
  static mapToNodeType(astNode) {
    let nodeTypes = [
      VariableAccessNode,
      LiteralAccessNode,
      
      BinaryExpressionNode,
      UnaryExpressionNode,
      UpdateExpressionNode,
      AssignmentExpressionNode,
      CallExpressionNode,
      ExpressionNode, //catch all      
      
      IfStatementNode,
      DeclaratorStatementNode,
      ForStatementNode,
      
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
  
  labelString() {
    return this.astNode.type;
  }
  
  variablesOfInterest() {
    return [];
  }
  
  assigns(identifier) {
    return false;
  }
  
  equalIdentifiers(identifier1, identifier2) {
    return (
      identifier1.name == identifier2.name
      && identifier1.scopeId == identifier2.scopeId)
  }
}

class ExpressionNode extends TraceNode {
  static get astTypes() { return ['Expression'] }
  
  valueString() {
    return this.value.toString();
  }
  
  labelString() {
    return '';
  }
  
  variablesOfInterestFor(nodes) {
    let identifiers = [];
    nodes.forEach((child) => {
      identifiers.push(...child.variablesOfInterest());
    })
    return identifiers;
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
      return this.argument.identifier; //fix me
    }
  }
  
  get argument() {
    return this.astNode.argument;
  }
  
  labelString() {
    return `${this.argument.name} = ${this.valueString()}`;
  }
  
  variablesOfInterest() {
    return [this.identifier];
  }
  
  assigns(identifier) {
    return this.equalIdentifiers(this.identifier, identifier);
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
    return this.equalIdentifiers(this.left, identifier);
  }
}

class CallExpressionNode extends ExpressionNode {
  static get astTypes() { return ['CallExpression'] }
  
  get function() {
    return this.children[0];
  }
  
  get numArgs() {
    return this.children.length - 2;
  }
  
  get arguments() {
    return this.children.slice(1, this.numArgs + 1);
  }
  
  get call() {
    this.children[this.children.length - 1];
  }
  
  labelString() {
    let callee = this.astNode.callee;
    let name = 'fn';
    if (callee.object) {
      name = callee.object.name;
    } else if (callee.property) {
      name = callee.property.name;
    } else if (callee.name) {
      name = callee.name;
    }
    let argString = this.arguments.map((expNode) => {
      return expNode.valueString();
    }).join(',');
    return `${name}(${argString}) -> ${this.valueString()}`;
  }
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

class DeclaratorStatementNode extends TraceNode {
  static get astTypes() { return ['VariableDeclarator'] }
  
  get init() {
    return this.children[0];
  }
  
  labelString() {
    let varName = this.astNode.id.name;
    return `${varName} = ${this.init.valueString()}`;
  }
  
  assigns(identifier) {
    return this.equalIdentifiers(this.astNode.id, identifier);
  }
}

class IfStatementNode extends TraceNode {
  static get astTypes() { return ['IfStatement'] }
  
  get test() {
    return this.children[0];
  }
  
  labelString() {
    return `if (${this.test.labelString()}) -> ${this.test.valueString()}`;
  }
  
  variablesOfInterest() {
    return this.test.variablesOfInterest();
  }
}

class ForStatementNode extends TraceNode {
  static get astTypes() { return ['ForStatement'] }
  
  labelString() {
    return 'for{}'
  }
}

class FunctionNode extends TraceNode {
  static get astTypes() { return ['Function'] }
  
  labelString() {
    return 'Function';
  }
}

window.lively4ExecutionTrace = ExecutionTrace