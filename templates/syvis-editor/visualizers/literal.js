export default node => {
  let nodeType = typeof node.value
  const classes = ['literal']

  if (node.regex) nodeType = 'regex'
  else if (node.value === null) nodeType = 'null'

  classes.push(nodeType)

  if (node.value === true) classes.push('true')
  if (node.value === false) classes.push('false')

  return [
    'span',
    {class: classes.join(' ')},
    node.regex
      ? String(node.value)
      : ['boolean', 'null'].includes(nodeType)
        ? ''
        : JSON
          .stringify(node.value)
          .replace(/^"(.*)"$/, '$1'),
  ]
}
