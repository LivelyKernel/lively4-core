import walkTree from '../walkTree.js'

export default node => {
  return [
    'span.objectExpression',
    walkTree(node.properties),
  ]
}
