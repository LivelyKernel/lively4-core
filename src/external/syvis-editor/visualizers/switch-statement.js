import walkTree from '../walkTree.js'

export default node => [
  '.switchStatement',
  ['span.discriminant', walkTree(node.discriminant)],
  ['span.cases', walkTree(node.cases)],
]
