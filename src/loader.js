//
// ES6 module loader
//
// Minimal System loader implementation based on
// https://github.com/caridy/es6-micro-loader
//
// Add class and babel transpile support. Transpile targets modern
// chrome browsers and omits much ES5 compatible transformations.
//
import * as path from 'path'
import * as babel from 'babel-core'


export class Loader {
  constructor({fetch}) {
    this._registry = Object.create(null)

    if (fetch) {
      this._fetch = fetch
    }
  }

  register(name, dependencies, wrapper) {
    if (Array.isArray(name)) {
      this._anonymousEntry = []
      this._anonymousEntry.push.apply(this._anonymousEntry, arguments)
      return // breaking to let the _load function to name the module
    }

    let proxy = Object.create(null)
    let values = Object.create(null)
    let mod, meta

    // creating a new entry in the internal registry
    this._registry[name] = mod = {

      // live bindings
      proxy: proxy,

      // exported values
      values: values,

      // if module is already initialized
      executed: false,

      // normalized dependencies
      dependencies: dependencies.map(dep => {
        return path.normalize(path.resolve(name, '..', dep))
      }),

      // other modules that depends on this so we can push updates into those modules
      dependants: [],

      // method used to push updates of dependencies into the module body
      update: (moduleName, moduleObj) => {
        meta.setters[mod.dependencies.indexOf(moduleName)](moduleObj)
      },

      execute: () => {
        // Flag as executed
        mod.executed = true

        mod.dependencies.map(dep => {
          let imports = this._get(dep) && this._registry[dep].values // optimization to pass plain values instead of bindings

          if (imports) {
            this.__registry[dep].dependants.push(name)

            mod.update(dep, imports)
          }
        })

        meta.execute()
      }
    }

    // collecting execute() and setters[]
    meta = wrapper(function(identifier, value) {
      values[identifier] = value

      // locking down the updates on the module to avoid infinite loop
      mod.lock = true

      mod.dependants.forEach(function(moduleName) {
        if (this._registry[moduleName] && !this._registry[moduleName].lock) {
          this._registry[moduleName].update(name, values)
        }
      })

      mod.lock = false

      if (!Object.getOwnPropertyDescriptor(proxy, identifier)) {
          Object.defineProperty(proxy, identifier, {
              enumerable: true,
              get: () => {
                  return values[identifier]
              }
          })
      }

      return value
    })
  }


  async import(modName, options = {}) {
    let name = path.normalize(modName)
    let mod = this._get(name)

    if (mod) {
      return mod
    }

    await this._load(name, options)

    return this._get(name)
  }


  transpile(blob, {filename}) {
    let source = babel.transform(blob, {
      plugins: [
        require('babel-plugin-syntax-async-functions'),
        require('babel-plugin-transform-es2015-modules-systemjs'),
        require('babel-plugin-transform-async-to-generator')
      ],
      sourceMaps: 'inline',
      filename: filename
    })

    return source
  }


  _get(name) {
    let mod = this._registry[name]

    if (mod && !mod.executed) {
      mod.execute()
    }

    return mod && mod.proxy
  }


  async _fetch(name) {
    let response = await fetch(name)
    let blob = await response.text()

    return blob
  }


  async _load(name, options = {}) {
    let blob = await this._fetch(name, options)

    let source =  this.transpile(blob, {
      moduleId: name,
      filename: name
    })

    new Function(source.code)()

    if (this._anonymousEntry) {
      console.log(this._anonymousEntry)
      this.register(name, this._anonymousEntry[0], this._anonymousEntry[1]);
      this._anonymousEntry = undefined;
    }

    return true
  }
}
