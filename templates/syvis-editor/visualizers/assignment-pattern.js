import walkTree from '../walkTree'

export default (node) => [
  'div.assignmentPattern',
  ['span.left', walkTree(node.left)],
  ['span.right', walkTree(node.right)],
]
