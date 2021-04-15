import SocketIO from 'src/external/socketio.js';

export const SocketSingleton = (function() {
  let socket;
  
  async function create(){
    const addr = await lively.prompt("Server Adress", "http://localhost:8080")
    if(addr === undefined) return;
    socket = SocketIO(addr);
    // TODO make input
    socket.emit('options',  {
      connectString: '127.0.0.1:1521/MLEEDITOR',
      user: 'system',
      password: 'MY_PASSWORD_123'
    });
    socket.on('busy', () => lively.warn('Resource currently busy'));
    socket.on('failure', err => lively.error('Resource failed processing', err));
    socket.on('success', status => {
      if(status === "connected") {
        lively.success("Connected");  
      }
    });
    return socket
  }
  
  return {
    get: () =>  !socket ? create() : socket,
    reset: () => create()
  }
})()