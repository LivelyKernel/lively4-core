import walkTree from '../walkTree'

export default node => [
  'div',
  {class: 'declarations ' + node.kind},
  walkTree(node.declarations),
]
