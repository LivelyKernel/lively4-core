import parseSugarString from './parseSugarString.js'
import * as escape from './escape.js'
import defaults from './defaults.js'
import mapAttributeValue from './mapAttributeValue.js'


export default function shaven (arrayOrObject) {

  if (!arrayOrObject || typeof arrayOrObject !== 'object') {
    throw new Error(
      'Argument must be either an array or an object ' +
      'and not ' + arrayOrObject
    )
  }

  let config = {}
  let elementArray

  if (Array.isArray(arrayOrObject)) {
    elementArray = arrayOrObject
  }
  else {
    elementArray = arrayOrObject.elementArray
    delete arrayOrObject.elementArray
    Object.assign(config, arrayOrObject)
  }

  config = Object.assign(
    {},
    defaults,
    config,
    {
      returnObject: { // Shaven object to return at last
        ids: {},
        references: {},
      },
    }
  )


  function createElement (sugarString) {
    const properties = parseSugarString(sugarString)
    const element = {
      tag: properties.tag,
      attr: {},
      children: [],
    }

    if (properties.id) {
      element.attr.id = properties.id
      console.assert(
        !config.returnObject.ids.hasOwnProperty(properties.id),
        `Ids must be unique and "${properties.id}" is already assigned`
      )
      config.returnObject.ids[properties.id] = element
    }
    if (properties.class) {
      element.attr.class = properties.class
    }
    if (properties.reference) {
      console.assert(
        !config.returnObject.ids.hasOwnProperty(properties.reference),
        `References must be unique and "${properties.id
        }" is already assigned`
      )
      config.returnObject.references[properties.reference] = element
    }

    config.escapeHTML = properties.escapeHTML != null
      ? properties.escapeHTML
      : config.escapeHTML

    return element
  }


  function buildDom (array) {
    
    if (!array) {
      console.warn('Arguments is not an array, but ' + typeof array)
      array = []
    }

    let index = 1
    let createdCallback
    const selfClosingHTMLTags = [
      'area',
      'base',
      'br',
      'col',
      'command',
      'embed',
      'hr',
      'img',
      'input',
      'keygen',
      'link',
      'menuitem',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]


    if (typeof array[0] === 'string') {
      array[0] = createElement(array[0])
    }
    else if (Array.isArray(array[0])) {
      index = 0
    }
    else {
      throw new Error(
        'First element of array must be a string, ' +
        'or an array and not ' + JSON.stringify(array[0])
      )
    }


    for (; index < array.length; index++) {

      // Don't render element if value is false or null
      if (array[index] === false || array[index] === null) {
        array[0] = false
        break
      }

      // Continue with next array value if current value is undefined or true
      else if (array[index] === undefined || array[index] === true) {
        continue
      }

      else if (typeof array[index] === 'string') {
        if (config.escapeHTML) {
          // eslint-disable-next-line new-cap
          array[index] = escape.HTML(array[index])
        }

        array[0].children.push(array[index])
      }

      else if (typeof array[index] === 'number') {

        array[0].children.push(array[index])
      }

      else if (Array.isArray(array[index])) {

        if (Array.isArray(array[index][0])) {
          array[index]
            .reverse()
            .forEach(subArray => { // eslint-disable-line no-loop-func
              array.splice(index + 1, 0, subArray)
            })

          if (index !== 0) continue
          index++
        }

        buildDom(array[index])

        if (array[index][0]) {
          array[0].children.push(array[index][0])
        }
      }

      else if (typeof array[index] === 'function') {
        createdCallback = array[index]
      }

      else if (typeof array[index] === 'object') {
        for (const attributeKey in array[index]) {
          if (!array[index].hasOwnProperty(attributeKey)) continue

          const attributeValue = array[index][attributeKey]

          if (array[index].hasOwnProperty(attributeKey) &&
            attributeValue !== null &&
            attributeValue !== false
          ) {
            array[0].attr[attributeKey] =
              mapAttributeValue(attributeKey, attributeValue)
          }
        }
      }
      else {
        throw new TypeError(`"${array[index]}" is not allowed as a value`)
      }
    }


    if (array[0] !== false) {
      let HTMLString = '<' + array[0].tag

      for (const key in array[0].attr) {
        if (array[0].attr.hasOwnProperty(key)) {
          const attributeValue = escape.attribute(array[0].attr[key])
          let value = attributeValue

          if (config.quoteAttributes ||
            /[ "'=<>]/.test(attributeValue)
          ) {
            value = config.quotationMark +
              attributeValue + config.quotationMark
          }

          HTMLString += ` ${key}=${value}`
        }
      }

      HTMLString += '>'

      if (!selfClosingHTMLTags.includes(array[0].tag)) {
        array[0].children.forEach(child => HTMLString += child)

        HTMLString += '</' + array[0].tag + '>'
      }

      array[0] = HTMLString
    }

    // Return root element on index 0
    config.returnObject[0] = array[0]
    config.returnObject.rootElement = array[0]

    config.returnObject.toString = () => array[0]

    if (createdCallback) createdCallback(array[0])
  }


  buildDom(elementArray)

  return config.returnObject
}

shaven.setDefaults = (object) => {
  Object.assign(defaults, object)
  return shaven
}
