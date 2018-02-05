import walkTree from '../walkTree'

export default node => {
  return [
    'span.objectExpression',
    walkTree(node.properties),
  ]
}
