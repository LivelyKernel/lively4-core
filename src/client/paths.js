'use strict';

export default class Paths {

  static normalize(path) {
      let source = path.split(/\/+/)
      let target = []

      for(let token of source) {
        if(token === '..') {
          target.pop()
        } else if(token !== '' && token !== '.') {
          target.push(token)
        }
      }

      if(path.charAt(0) === '/')
          return '/' + target.join('/')
      else
          return target.join('/')
  }

  static join(a, b) {
    if(b[0] === '/') {
      return this.normalize(b)
    } else {
      return this.normalize(a + '/' + b)
    }
  }
}

console.log("loaded paths.js")
