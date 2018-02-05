import walkTree from '../walkTree'

export default node => [
  'span.newExpression',
  'new ',
  ['span', walkTree(node.callee)],
  ['span.leftSeparator', '('],
  ['span', ...node.arguments.map(walkTree)],
  ['span.rightSeparator', ')'],
]
