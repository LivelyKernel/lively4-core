/*MD
# Collections: Beyond Set and Map

## [Tests](edit://test/collections-test.js)

<!-- go directly there
## [Tests](../../test/collections-test.js)
-->

## GroupMap: A Map of Sets

MD*/

export class GroupMap  {
    
    constructor(array) {
      this._map = new Map()
      
      // #Meta will be shown by examples... which I do not desire....
      if (array) {
        for(var key of Object.keys(array)) {
          for(var ea of array[key]) {
            this.add(key, ea)
          }
        }
      }
    }
    
    get values() {
      this._map.values()
    }
    
    get keys() {
      this._map.values()
    }
    
    ensureItems(key) {
      var items = this._map.get(key)
      if (!items) {
        items = new Set()
        this._map.set(key, items)
      }
      return items
    }
    
    /*
      adds a value to a set under a key 
    */
    add(key, value) {
      this.ensureItems(key).add(value)
    }
    
    remove(key, value) {
      this.ensureItems(key).delete(value)
    }
    
    map(cb) {
      return Array.from(this._map.keys()).map(key => cb(key, this._map.get(key)))
    }
    
  }