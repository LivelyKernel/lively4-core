import walkTree from '../walkTree'

export default (node) => [
  '.catchClause',
  ['span.param', walkTree(node.param)],
  ['span.body', walkTree(node.body)],
]
