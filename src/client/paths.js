export default class Paths {
    
  /* url, path, relative path... anything */
  static normalizePath(path, base, root=lively4url) {
    base = base.replace(/[^/]*$/,"") // if it is not a dir
    var normalized = path
    if (path.match(/^[A-Za-z]+:/)) {
      // do nothing
    } else if (path.match(/^\//)) {
      normalized = path.replace(/^\//, root + "/")
    } else {
      normalized =  base + path
    }
    return Paths.normalizeURL(normalized)
  }
  
   static normalizeURL(urlString) {
    var url = new URL(urlString);
    url.pathname = this.normalize(url.pathname);
    return  "" + url;
  }
  
  
  /* normalize only the "path" part of an URL */
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
