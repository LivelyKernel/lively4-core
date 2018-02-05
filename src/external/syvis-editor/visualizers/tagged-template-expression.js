import walkTree from '../walkTree.js'

export default node => {
  return [
    'span.taggedTemplateExpression',
    ['span.tag', walkTree(node.tag)],
    ['span.quasi', walkTree(node.quasi)],
  ]
}
