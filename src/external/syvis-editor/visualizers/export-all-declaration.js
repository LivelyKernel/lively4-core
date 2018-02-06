import walkTree from '../walkTree.js'

export default node => [
  'span.exportAllDeclaration',
  walkTree(node.source),
]
