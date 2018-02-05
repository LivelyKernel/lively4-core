import walkTree from '../walkTree.js'

export default node => [
  'div',
  {class: 'declarations ' + node.kind},
  walkTree(node.declarations),
]
