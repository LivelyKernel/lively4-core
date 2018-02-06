import operatorMap from '../operatorMap.js'
import walkTree from '../walkTree.js'

export default node => [
  'span.unaryExpression',
  {
    class: 'operator-' + (operatorMap.unary[node.operator] || ''),
  },
  walkTree(node.argument),
]
