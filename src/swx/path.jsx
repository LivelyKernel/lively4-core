
export function normalize(path) {
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

export function join(a, b) {
  return normalize(a + '/' + b)
}
