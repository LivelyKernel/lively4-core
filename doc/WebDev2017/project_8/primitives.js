/* eslint-disable no-unused-vars, quotes */
var varInteger = 123
let letInteger = 123
const constInteger = 123
const float = 123.456
const notANumber = NaN
const emptyString = ''
const string = 'This is valA string'
const stringConcat = 'This' + 'is' + 'a' + 'string' + 'as' + 'well'
const longString = 'This is a very long string. \
  It is used to test the line wrapping behavior of syvis. \
  Some more text to make the line even longer.'
const templateString = `This is also just a string`
const templateWithExpressions = `This is a ${'VE' + 'RY'} special string`
const taggedTemplateString = String.raw `Also ${'VE' + 'RY'} special`
const regex = /[0-9]{4}-([a-z]{5})?/gi
const boolean = true
const infinity = Infinity
const undefinedValue = undefined
const nullValue = null
const voidValue = void 0
const typeofValue = typeof 0
const date = new Date('2017-11-29')

const object = {
  key1: 'and value',
  key2: 'another value',
  "string key": 'should look the same',
}
const array = [
  'item 1',
  'item 2',
  'item 3',
]

const arrowFunction = xValue =>
  xValue * xValue
const arrayPattern = ([xValue, yValue]) =>
  xValue + yValue

{
  const assignmentInBlock = 'indeed'
}

;


let valueA = 1
let valueB = 1

valueA = valueB
valueA += valueB
valueA -= valueB
valueA *= valueB
valueA /= valueB
valueA %= valueB
valueA <<= valueB
valueA >>= valueB
valueA >>>= valueB
valueA &= valueB
valueA |= valueB
valueA ^= valueB
