import walkTree from '../walkTree.js'

export default node => {
  const hasInit = Boolean(node.init)
  const classes = ['declaration']

  if (hasInit) classes.push('hasInit')

  return [
    'div',
    {class: classes.join(' ')},
    walkTree(node.id),
    ['span.init', hasInit
      ? walkTree(node.init)
      : null,
    ],
  ]
}
