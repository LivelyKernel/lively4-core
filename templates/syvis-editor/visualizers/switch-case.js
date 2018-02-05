import walkTree from '../walkTree'

export default node => [
  '.switchCase',
  ['span.test', walkTree(node.test)],
  ['span.consequent', walkTree(node.consequent)],
]
