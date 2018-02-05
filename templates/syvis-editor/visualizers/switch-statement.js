import walkTree from '../walkTree'

export default node => [
  '.switchStatement',
  ['span.discriminant', walkTree(node.discriminant)],
  ['span.cases', walkTree(node.cases)],
]
