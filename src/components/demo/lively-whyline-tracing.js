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
  
  traceNode(id, exp) {
    var traceNode = this.newTraceNode(id);
    this.parentNode = traceNode;
    var value = exp();
    traceNode.value = value;
    this.parentNode = traceNode.parent;
    return value;
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
    
  findLastDataFlowOf(identifier){
    let pred = this
    while((pred = pred.predecessor())){
      let predId = pred.getIdentifier()
      
      if(predId && predId.name == identifier.name && predId.scopeId == identifier.scopeId) {
        return pred
      }
    }    
  }
  
  getIdentifier(){
    switch(this.astNode.type)
    {
      case 'AssignmentExpression':
        return this.children[0].astNode.left
      
      case 'UpdateExpression':
        return this.astNode.argument
      
      case 'VariableDeclarator':
        return this.astNode.id
      
      default:
        return null
    }
  }
  
  referencedIdentifiers(){
    let identifiers = []
    switch(this.astNode.type) {
      case 'Identifier':
        return [this]
      
      case 'AssignmentExpression':
        identifiers.push(this.astNode.left)
        break
        
      case 'UpdateExpression':
        identifiers.push(this.astNode.argument)
        break
        
      case 'BinaryExpression':
        if (this.astNode.left.type == 'Identifier') {
          identifiers.push(this.astNode.left)
        }
        if (this.astNode.right.type == 'Identifier') {
          identifiers.push(this.astNode.right)
        }
        break
        
      case 'CallExpression':
        break
      
      default:
        return []
    }
    
    this.children.forEach((c) => {
      identifiers.push(...c.referencedIdentifiers())
    })
    return identifiers
  }
  
  questions(){
    let questions = [
      ['Back', () => this.predecessor()],
      ['Up', () => this.whyWasThisStatementExecuted()]]
    let referencedVars = this.referencedIdentifiers()
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
      questions.push([`Last assignment of '${id.name}'`, () => this.findLastDataFlowOf(id)])
    })
    return questions
  }
  
  static mapToNodeType(astNode) {
    let nodeTypes = [
      BinaryExpressionNode,
      UnaryExpressionNode,
      UpdateExpressionNode,
      AssignmentExpressionNode,
      VariableAccessNode,
      LiteralAccessNode,
      DeclaratorStatementNode
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
      return t.isType(astType, astNode.type);
    })
  }
  
  labelString() {
    return 'Not Awesome'
  }
}

class ExpressionNode extends TraceNode {
  
}

class BinaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['BinaryExpression', 'LogicalExpression'] }
}

class UnaryExpressionNode extends ExpressionNode {
  static get astTypes() { return ['UnaryExpression'] }
}

class UpdateExpressionNode extends ExpressionNode {
  static get astTypes() { return ['UpdateExpression'] }
}

class AssignmentExpressionNode extends ExpressionNode {
  static get astTypes() { return ['AssignmentExpression'] }
  
  labelString() {
    return 'Awesome'
  }
}

class VariableAccessNode extends TraceNode {
  static get astTypes() { return ['Identifier'] }
}

class LiteralAccessNode extends TraceNode {
  static get astTypes() { return ['Literal'] }
}

class DeclaratorStatementNode extends TraceNode {
  static get astTypes() { return ['VariableDeclarator'] }
}

window.lively4ExecutionTrace = ExecutionTrace