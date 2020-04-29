import { cloneDeep } from 'src/external/lodash/lodash.js';

const NETWORK_LATENCY = 1;

export default class NetworkComponent {
  
  constructor(node) {
    this._node = node;
    this._addSelfToGlobalListOfPeers();
  }
  
  getBlockchainLength() {
    return this._node.blockchain.size();
  }
  
  getLatestBlockDate() {
    return this._node.blockchain.headOfChain.timestamp;
  }
  
  requestBlockchain() {
    // select random peer
    let relevantBlockchainProvider = null;
    NetworkComponent.peers.forEach(peer => {
      if(peer !== this) {
        if (relevantBlockchainProvider == null || relevantBlockchainProvider.getBlockchainLength() < peer.getBlockchainLength()
           || (relevantBlockchainProvider.getBlockchainLength() == peer.getBlockchainLength()
                && relevantBlockchainProvider.getLatestBlockDate() < peer.getLatestBlockDate()
              )
           ) {
          relevantBlockchainProvider = peer;
        } 
      }
    });
    if(!relevantBlockchainProvider) {
      return;
    }
    // request blockchain
    this.receiveBlockchain(cloneDeep(relevantBlockchainProvider._node._blockchain));
    //this._simulateNetwork(() => peer.provideBlockchain(this));
  }
  
  // simplified Peer-Handling: All peers are known via central source of truth
  _addSelfToGlobalListOfPeers() {
    if(NetworkComponent.peers == null) {
      NetworkComponent.peers = new Array();
    }
    NetworkComponent.peers.push(this);
  }
  
  async _simulateNetwork(sendToDestinationSocket) {
    await new Promise(sleep => setTimeout(sleep, NETWORK_LATENCY * 1000));
    sendToDestinationSocket();
  }
  
  // Sending to peers
  
  propagateTransaction(transaction) {
    NetworkComponent.peers.forEach(peer => {
      if(peer !== this) {
        this._simulateNetwork(peer.receiveTransaction.bind(peer, cloneDeep(transaction)));
      }
    });
  }
  
  propagateBlock(block) {
    NetworkComponent.peers.forEach(peer => {
      if(peer !== this) {
        this._simulateNetwork(peer.receiveBlock.bind(peer, cloneDeep(block)));
      }
    });
  }
  
  // Receiving from peers
  
  receiveBlock(block) {
    this._node.handleBlock(block);
  }
  
  receiveTransaction(transaction) {
    this._node.handleTransaction(transaction);
  }
  
  receiveBlockchain(blockchain) {
    if(blockchain) {
      this._node.handleBlockchain(blockchain);
    } else {
      this.requestBlockchain();
    }
  }
  
}