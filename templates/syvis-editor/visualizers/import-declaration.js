import walkTree from '../walkTree'

export default node => [
  '.importDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.source', walkTree(node.source)],
]
