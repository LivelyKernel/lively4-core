import Blockchain from "../blockchain/blockchain.js";
import NetworkComponent from "networkComponent.js";
import Wallet from "../wallet/wallet.js";
import Miner from "miner.js";

export default class BlockchainNode {
  
  constructor(firstNode = false) {
    this._blockchain = null;
    if(firstNode) {
      this._blockchain = new Blockchain();
    }
    this._networkComponent = new NetworkComponent(self);
    this._miner = new Miner();
    this._wallet = new Wallet();
  }
  
  blockchainIsValid(blockchain) {
    // Currently double spend check is not implemented
    let currentBlock = blockchain.headOfChain;
    let counter = 0;
    while(currentBlock) {
      counter += 1;
      if(!currentBlock.isVerified()) {
        return false;
      }
      currentBlock = blockchain.get(currentBlock.previousHash);
    }
    if(counter != blockchain.size()) {
      return false;
    }
    return true;
  }
  
  handleBlock(block) {
    this._blockchain.add(block);
  }
  
  handleTransaction(transaction) {
    if(!transaction.isVerified()) {
      // only accept verified transactions
      return;
    }
    this._miner.addTransaction(transaction);
  }
  
  handleBlockchain(blockchain) {
    if(blockchain) {
      return;
    }
    //TODO: Validate blockchain before saving
  }
  
  // Sending to other nodes (via network component)
  
  propagateBlock(block) {
    this._networkComponent.propagateBlock(block);
  }
  
  propagateTransaction(transaction) {
    this._networkComponent.propagateTransaction(transaction);
  }
    
}