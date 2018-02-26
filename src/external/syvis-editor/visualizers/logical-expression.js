import walkTree from '../walkTree.js'
import operatorMap from '../operatorMap.js'

export default node => {
  const classes = ['logicalExpression']
  if (node.operator) {
    classes.push('operator-' + operatorMap.binary[node.operator])
  }

  return [
    'span',
    {class: classes.join(' ')},
    ['span.left', walkTree(node.left)],
    ['span.right', walkTree(node.right)],
  ]
}
