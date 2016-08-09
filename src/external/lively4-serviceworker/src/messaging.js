/*
 *
 */

export function broadcast(message) {
  return self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      try {
        client.postMessage({
          meta: { type: 'broadcast' },
          message: message
        })
      } catch(err) {
        console.log('Error during broadcast: ', err)
        throw err
      }
    })
  })
}

export function hasPort(event) {
  return e.ports
}

export function getSource(event) {
  return event.ports[0]
}

var tasks = []

export function define(name, match, fn) {
  tasks.push({name: name, match: match, fn: fn})
}

export function process(event) {
  return tasks.some((task) => task.match(event) && task.fn(event))
}

// addMessageTask('test send back', (event) => {
//   return hasPort(event) && event.data && event.data.meta && event.data.meta.type === 'foo'
// }, (event) => {
//   getSource(event).postMessage({
//     meta: {
//       type: 'msg send back',
//       receivedMessage: event.data
//     },
//     message: 'Sending Back a Message'
//   })

//   return true
// })
