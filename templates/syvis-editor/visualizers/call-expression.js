import walkTree from '../walkTree'

export default (node) => [
  'span.callExpression',
  ['span.callee', walkTree(node.callee)],
  ['span.arguments', walkTree(node.arguments)],
]
