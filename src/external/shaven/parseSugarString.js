export default (sugarString) => {
  const tags = sugarString.match(/^[\w-]+/)
  const properties = {
    tag: tags ? tags[0] : 'div',
  }
  const ids = sugarString.match(/#([\w-]+)/)
  const classes = sugarString.match(/\.[\w-]+/g)
  const references = sugarString.match(/\$([\w-]+)/)

  if (ids) properties.id = ids[1]

  if (classes) {
    properties.class = classes
      .join(' ')
      .replace(/\./g, '')
  }

  if (references) properties.reference = references[1]

  if (sugarString.endsWith('&') || sugarString.endsWith('!')) {
    properties.escapeHTML = false
  }

  return properties
}
