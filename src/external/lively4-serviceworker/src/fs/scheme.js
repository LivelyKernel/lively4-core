import { Base } from './base.js'

export default class PolymorphicIdendifierFs extends Base {
  constructor(path, options) {
    super('scheme', path, options)
  }

  read(path) {
    return this._rpc({name: 'swx:pi:GET', path: path})
      .then((event) => event.data.content)
  }

  write(path, content) {
    return content.then(((actualContent) => {
      return this._rpc({
        name: 'swx:pi:PUT',
        path: path,
        content: actualContent
      }).then((event) => event.data.content)
    }).bind(this))
  }

  async stat(path, request, no_cache=false) {
    return this._rpc({name: 'swx:pi:OPTIONS', path: path})
      .then((event) => event.data.content)
  }
  
  
  _rpc(data) {
    return new Promise((resolve, reject) => {
      console.log('RPC request:', data)
      self.clients.matchAll().then((clients) => {
        let channel = new MessageChannel()
        let client  = clients[0]

        var done = false
        channel.port1.onmessage = (...args) => {
          done  = true
          resolve(...args)
        }
        client.postMessage(data, [channel.port2])
        
        setTimeout(() => {
          if (!done) reject("timeout")
        }, 10 * 1000)
      })
    }).then((event) => {
      console.log('RPC response:', event.data)
      return event
    }).then((event) => {
      if(event.data.error) {
        throw new Error(event.data.error)
      } else {
        return event
      }
    })
  }
}
