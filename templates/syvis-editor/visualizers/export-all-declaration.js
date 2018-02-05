import walkTree from '../walkTree'

export default node => [
  'span.exportAllDeclaration',
  walkTree(node.source),
]
