const NETWORK_LATENCY = 1;

export default class NetworkComponent {
  
  constructor(node) {
    self._node = node;
    self._addSelfToGlobalListOfPeers();
  }
  
  // Simplified Peer-Handling: All peers are known via central source of truth
  _addSelfToGlobalListOfPeers() {
    if(NetworkComponent.peers != null) {
      NetworkComponent.peers = new Array();
    }
    NetworkComponent.peers.push(self);
  }
  
  async _simulateNetwork(sendToDestinationSocket) {
    await new Promise(sleep => setTimeout(sleep, NETWORK_LATENCY * 1000));
    sendToDestinationSocket();
  }
  
  // Sending to peers
  
  propagateTransaction(transaction) {
    NetworkComponent.peers.forEach(peer => {
      this._simulateNetwork(peer.receiveTransaction.bind(this, Object.assign({}, transaction)));
    });
  }
  
  propagateBlock(block) {
    NetworkComponent.peers.forEach(peer => {
      this._simulateNetwork(peer.receiveBlock.bind(this, Object.assign({}, block)));
    });
  }
  
  // Receiving from peers
  
  receiveBlock(block) {
    this._node.handleBlock(block);
  }
  
  receiveTransaction(transaction) {
    this._node.handleTransaction(transaction);
  }
  
}