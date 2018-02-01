/*
 * Some statistics...
 */ 
export default class AboutLively {
  
  static findLargeElements() {
    return _.sortBy(
      Array.from(lively.allElements()).map(ea => 
        new Object({
          id: ea.id, 
          element: ea, target: ea.target, 
          children: lively.allElements(true, ea).size
        })),
      ea => ea.children).reverse()
  }

  static groupAndCountElemments(deep) {
    var set = lively.allElements(deep)
    return _.map(_.groupBy(Array.from(set), ea => ea.tagName), (value, key) => {
      return [key, value.length]                         
    })
  }
  
  
}