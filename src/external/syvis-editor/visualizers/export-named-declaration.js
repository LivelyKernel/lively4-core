import walkTree from '../walkTree.js'

export default node => [
  'span.exportNamedDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.declaration', walkTree(node.declaration)],
]
