import Blockchain from "../blockchain/blockchain.js";
import NetworkComponent from "./networkComponent.js";
import Wallet from "../wallet/wallet.js";
import Miner from "./miner.js";


export default class BlockchainNode {
  
  constructor() {
    this._hasExited = false;
    this._wallet = new Wallet();
    this._blockchain = new Blockchain(this._wallet);
    this._networkComponent = new NetworkComponent(this);
    this._miner = new Miner(this);
    this._networkComponent.requestBlockchain();
    this._subscribers = [];
  }
  
  get blockchain() {
    return this._blockchain;
  }
  
  get wallet() {
    return this._wallet;
  }
  
  get hasExited() {
    return this._hasExited;
  }
  
  exit() {
    this._hasExited = true;
  }
  
  async mine() {
    await this._miner.mine();
  }
  
  subscribe(lSubscriber, callback) {
    this._subscribers.push({subscriber: lSubscriber, callback: callback});
  }
  
  unsubscribe(lSubscriber) {
    this._subscribers = this._subscribers.filter(
      item => item.subscriber !== lSubscriber
    );
  }
  
  sendTransaction(receivers) {
    const tx = this.wallet.newTransaction(receivers);
    this.propagateTransaction(tx);
    
    return tx;
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
    this._miner.invalidateTransactions(block);
    block.transactions.forEach(transaction => this.wallet.receive(transaction));
    this._blockchain.add(block);
    this._notifySubscribers(block);
  }
  
  handleTransaction(transaction) {
    if(!transaction.isVerified()) {
      // only accept verified transactions
      return;
    }
    this._miner.addTransaction(transaction);
  }
  
  handleBlockchain(blockchain) {
    if(!blockchain) {
      return;
    }
    //TODO: Validate blockchain before saving
    this._blockchain = blockchain;
  }
  
  // Sending to other nodes (via network component)
  
  propagateBlock(block) {
    this.handleBlock(block);
    this._networkComponent.propagateBlock(block);
  }
  
  propagateTransaction(transaction) {
    this.handleTransaction(transaction);
    this._networkComponent.propagateTransaction(transaction);
  }
  
  _notifySubscribers(block) {
    this._subscribers.forEach(item => item.callback(block));
  }
    
}