import walkTree from '../walkTree.js'

export default (node) => [
  'div.classBody',
  walkTree(node.body),
]
