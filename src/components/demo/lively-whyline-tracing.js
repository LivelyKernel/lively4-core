

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
  
  traceLogNode(id){
    this.newTraceNode(id)
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
}

window.lively4ExecutionTrace = ExecutionTrace