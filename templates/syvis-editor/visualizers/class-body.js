import walkTree from '../walkTree'

export default (node) => [
  'div.classBody',
  walkTree(node.body),
]
