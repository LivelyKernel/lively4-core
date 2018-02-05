import walkTree from '../walkTree'

export default node => {
  const classes = [
    'property',
    node.kind,
  ]

  if (node.method) classes.push('method')
  if (node.shorthand) classes.push('shorthand')

  return [
    'span',
    {class: classes.join(' ')},
    ['span.key', walkTree(node.key)],
    ['span.separator'],
    ['span.value', walkTree(node.value)],
  ]
}
