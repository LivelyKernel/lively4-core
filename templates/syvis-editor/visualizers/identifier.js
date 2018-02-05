const specialClassMap = {
  Infinity: 'infinity',
  undefined: 'undefined',
  NaN: 'nan',
}

module.exports = (node) => {
  const classes = ['identifier']

  if (specialClassMap.hasOwnProperty(node.name)) {
    classes.push(specialClassMap[node.name])
    node.name = ''
  }

  if (node.isFunctionParameter) {
    classes.push('parameter')
  }

  return [
    'span',
    {class: classes.join(' ')},
    node.name,
  ]
}
