import walkTree from '../walkTree.js'

export default node => [
  '.switchCase',
  ['span.test', walkTree(node.test)],
  ['span.consequent', walkTree(node.consequent)],
]
