

export default class ExecutionTrace {
  constructor(astRootNode){
    this.astRoot = astRootNode
    this.nodeMap = astRootNode.node_map
    this.traceRoot = this.newTraceNode(astRootNode.traceid)
    this.parentNode = this.traceRoot
  }
  
  newTraceNode(astNodeId){
    return new TraceNode(this.nodeMap[astNodeId], this.parentNode)
  }
  
  traceNode(id, exp){
    var traceNode = this.newTraceNode(id)
    this.parentNode = traceNode
    var value = exp()
    traceNode.value = value;
    this.parentNode = traceNode.parent
    return value
  }
  
  traceBeginNode(id){
    this.parentNode = this.newTraceNode(id)
  }
  
  traceEndNode(id){
    this.parentNode = this.parentNode.parent
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
  
  findLastDataFlow(){
    let AssignmentASTNodeTypes = ['AssignmentExpression', 'UpdateExpression', 'VariableDeclarator']
    let identifier = this.getIdentifier()
    let pred = this
    console.log(this)
    console.log(identifier)
    while((pred = pred.predecessor())){
      let predId = pred.getIdentifier()
      
      if(predId && predId.name == identifier.name && predId.scopeId == identifier.scopeId)
      {
        console.log(pred)
        return pred
      }
    }    
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
      
      default:
        return []
    }
    
    let subReferences = this.children.map((c) => {
      return c.referencedIdentifiers()
    })
    return identifiers.concat(...subReferences)
  }
  
  questions(){
    let questions = {
      'Back' : () => this.predecessor(),
      'Up': () => this.whyWasThisStatementExecuted()}
    this.referencedIdentifiers().forEach((id) => {
      questions[`Last assignment of '${id.name}'`] = () => {
        return this.findLastDataFlowOf(id)
      }
    })
    return questions
  }
  
  isAssignment() {
    let assignmentTypes = ['AssignmentExpression', 'UpdateExpression', 'VariableDeclarator']
    return assignmentTypes.includes(this.astNode.type)
  }
}

window.lively4ExecutionTrace = ExecutionTrace