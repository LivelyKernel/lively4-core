import systemBabel from 'systemjs-babel-build';
const { types: t, template, traverse } = systemBabel.babel;

export default class ExecutionTrace {
  constructor(astRootNode){
    this.astRoot = astRootNode
    this.nodeMap = astRootNode.node_map
    this.traceRoot = this.newTraceNode(astRootNode.traceid)
    this.parentNode = this.traceRoot
    this.reference = '__trace__'
    this.wrapBlockTemplate = template(`${this.reference}.MESSAGE(ID,() => BLOCK)`)
  }
  
  newTraceNode(astNodeId, nodeType = TraceNode) {
    return new nodeType(this.nodeMap[astNodeId], this.parentNode)
  }
  
  traceNode(id, exp, nodeType = TraceNode) {
    var traceNode = this.newTraceNode(id, nodeType)
    this.parentNode = traceNode
    var value = exp()
    traceNode.value = value;
    this.parentNode = traceNode.parent
    return value
  }
  
  traceBeginNode(id) {
    this.parentNode = this.newTraceNode(id)
  }
  
  traceEndNode(id) {
    this.parentNode = this.parentNode.parent
  }
  
  wrapBlock(message, id, blockOrExp) {
    return this.wrapBlockTemplate({
      MESSAGE: t.identifier(message),
      ID: t.numericLiteral(id),
      BLOCK: blockOrExp
    }).expression //Or do we ever actually prefer ExpressionStatement over Expression?
  }
  
  binaryExpression(id, exp) {
    return this.traceNode(id, exp, BinaryExpressionNode)
  }
}

class TraceNode {
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
  
  isAssignment() {
    let assignmentTypes = ['AssignmentExpression', 'UpdateExpression', 'VariableDeclarator']
    return assignmentTypes.includes(this.astNode.type)
  }
}

class ExpressionNode extends TraceNode {
  static expressionCallback(expressionType, trace) {
    const nodeClass = this
    return {
      [expressionType](path) {
        let node = path.node
        let id = node.traceId
        if (!id || node.isTraced) return;
        node.isTraced = true
        
        path.replaceWith(trace.wrapBlock(nodeClass.traceMessage, id, path))
      }
    }[expressionType]
  }
  
  static callbacks(trace) {
    return this.expressionTypes.map((type) => {
      return this.expressionCallback(type, trace)
    })
  }
}

class BinaryExpressionNode extends ExpressionNode {
  static get traceMessage() { return 'binaryExp' }
  static get expressionTypes() {
    return ['BinaryExpression', 'LogicalExpression']
  }
}

class UnaryExpressionNode extends ExpressionNode {
  static get traceMessage() { return 'unaryExp' }
  static get expressionTypes() { return ['UnaryExpression'] }
}

class UpdateExpressionNode extends ExpressionNode {
  static get traceMessage() { return 'updateExp' }
  static get expressionTypes() { return ['UpdateExpression'] }
}

class AssignmentExpressionNode extends ExpressionNode {
  static get traceMessage() { return 'assignmentExp' }
  static get expressionTypes() { return ['AssignmentExpression'] }
}

class DeclaratorStatementNode extends TraceNode {
  static get traceMessage() { return 'declareVar' }
  
  static callbacks(trace) {
    const nodeClass = this
    return [
      function VariableDeclarator(path) {
        let node = path.node
        let id = node.traceId
        if (!id || node.isTraced) return;
        node.isTraced = true
        
        if (node.init) {
          node.init = trace.wrapBlock(nodeClass.traceMessage, id, node.init)
        }
      }
    ]
  }
}

window.lively4ExecutionTrace = ExecutionTrace