import walkTree from '../walkTree.js'

export default node => [
  '.importDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.source', walkTree(node.source)],
]
