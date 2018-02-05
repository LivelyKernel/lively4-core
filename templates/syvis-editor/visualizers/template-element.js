module.exports = (node) => {
  const classes = ['templateElement', 'string']

  if (node.tail) classes.push('tail')

  return [
    'span',
    {class: classes.join(' ')},
    node.value.raw,
  ]
}
