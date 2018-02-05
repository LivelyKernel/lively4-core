import walkTree from '../walkTree'

export default node => [
  'div.exportDefaultDeclaration',
  walkTree(node.declaration),
]
