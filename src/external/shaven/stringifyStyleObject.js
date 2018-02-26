function sanitizeProperties (key, value) {
  if (value === null || value === false || value === undefined) return
  if (typeof value === 'string' || typeof value === 'object') return value

  return String(value)
}

export default (styleObject) => {
  return JSON
    .stringify(styleObject, sanitizeProperties)
    .slice(2, -2)
    .replace(/","/g, ';')
    .replace(/":"/g, ':')
    .replace(/\\"/g, '\'')
}
