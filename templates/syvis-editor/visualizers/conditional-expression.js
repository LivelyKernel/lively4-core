import walkTree from '../walkTree.js'

export default (node) => [
  'span.conditionalExpression',
  ['span', walkTree(node.test)],
  ['span', ' ? '],
  ['span', walkTree(node.consequent)],
  ['span', ' : '],
  ['span', walkTree(node.alternate)],
]
