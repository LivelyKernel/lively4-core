/**
 * Sends a message to all clients
 */
export async function _send(type, command, data) {
  const clients = await self.clients.matchAll();
  
  for (let client of clients) {
    try {
      client.postMessage({
        type: type,
        command: command,
        data: data
      });
    } catch(err) {
      console.log('Error during broadcast: ', err);
      throw err;
    }
  }
}

/**
 * Sends a notification to all clients
 */
export async function notify(level, message) {
  return _send('notification', level, message);
}

/**
 * Sends data to the cacheviewer
 */
export async function sendData(command, data) {
  return _send('dataResponse', command, data);
}


export function hasPort(event) {
  return e.ports;
}

export function getSource(event) {
  return event.ports[0];
}

var tasks = [];

export function define(name, match, fn) {
  tasks.push({name: name, match: match, fn: fn});
}

export function process(event) {
  return tasks.some((task) => task.match(event) && task.fn(event));
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
