import SocketIO from 'src/external/socketio.js';

export const SocketSingleton = (function() {
  let socket;
  
  async function create(){
    const addr = await lively.prompt("Server Adress", "http://localhost:8080")
    if(addr === undefined) return;
    socket = SocketIO(addr);
    // TODO make input
    socket.emit('options',  {
      connectString: 'localhost:1521/MLEEDITOR',
      user: 'system',
      password: 'MY_PASSWORD_123'
    });
    return socket
  }
  
  return {
    get: () =>  !socket ? create() : socket
  }
})()