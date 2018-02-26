import walkTree from '../walkTree.js'

export default node => {
  const classes = ['templateElement', 'string']

  if (node.tail) classes.push('tail')

  return [
    'span',
    {class: classes.join(' ')},
    node.value.raw,
  ]
}
