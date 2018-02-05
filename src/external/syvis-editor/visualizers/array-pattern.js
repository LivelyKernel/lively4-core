import walkTree from '../walkTree.js'

export default (node) => [
  '.arrayPattern',
  walkTree(node.elements),
]
