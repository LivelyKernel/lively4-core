import walkTree from '../walkTree'

export default (node) => [
  '.arrayPattern',
  walkTree(node.elements),
]
