import walkTree from '../walkTree.js'

export default (node) => [
  'span.callExpression',
  ['span.callee', walkTree(node.callee)],
  ['span.arguments', walkTree(node.arguments)],
]
