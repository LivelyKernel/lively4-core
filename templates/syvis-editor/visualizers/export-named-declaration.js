import walkTree from '../walkTree'

export default node => [
  'span.exportNamedDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.declaration', walkTree(node.declaration)],
]
