import walkTree from '../walkTree.js'

export default node => [
  'div.exportDefaultDeclaration',
  walkTree(node.declaration),
]
