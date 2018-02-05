import buildTransformString from './buildTransformString.js'
import stringifyStyleObject from './stringifyStyleObject.js'

export default (key, value) => {
  if (value === undefined) {
    return ''
  }

  if (key === 'style' && typeof value === 'object') {
    return stringifyStyleObject(value)
  }

  if (key === 'transform' && Array.isArray(value)) {
    return buildTransformString(value)
  }

  return value
}
