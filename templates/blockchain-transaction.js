"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Wallet from 'src/blockchain/wallet/wallet.js';
import Transaction from 'src/blockchain/transaction/transaction.js';
import TransactionInputCollection from 'src/blockchain/transaction/transactionInputCollection.js';
import TransactionOutputCollection from 'src/blockchain/transaction/transactionOutputCollection.js';

export default class BlockchainTransaction extends Morph {
  
  
  async initialize() {
    this.windowTitle = "BlockchainTransactionView";
    this.registerButtons()

    lively.html.registerKeys(this); 
    
    this.transaction = null;
  }
  
  set transaction(transaction) {
    this.transaction = transaction;
    this.update();
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
  }

  async update() {
    if(!this.transaction) {
      return
    }
    this.getElementById('timestamp').innerHTML = this.transaction.timestamp;
  }
  
  
  async livelyExample() {
    const sender = new Wallet();
    const inputCollection = new TransactionInputCollection(sender);
    const outputCollection = new TransactionOutputCollection();
    this.transaction = new Transaction(sender, inputCollection, outputCollection);
  }
  
  
}