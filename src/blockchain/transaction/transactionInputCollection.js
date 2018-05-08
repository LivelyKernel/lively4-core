import forge from 'node_modules/node-forge/dist/forge.min.js';

/**
  Intended usage:
  
  var inputs = new TransactionInputCollection(sender)
                    .add(transaction1)
                    .add(transaction2)
                    .add(transaction3)
                    .finalize();
**/

export default class TransactionInputCollection {
  constructor(senderWallet) {
    this._senderWallet = senderWallet;
    this._transactionInputs = new Map();
    this.hash = null;
  }
  
  add(transaction) {
    if (this.isFinialized()) {
      return this;
    }
    
    var output = transaction.outputs.get(this._senderWallet.hash);    
    if (output == null) {
      // the sender was not credited in the given transaction
      return this;
    }
    
    this._transactionInputs.set(output.hash, output);
    return this;
  }
  
  value() {
    return Array.from(this._transactionInputs.entries()).reduce((total, output) => {
      total += output.amount;
    },0);
  }
  
  finalize() {
    if (this.isFinialized()) {
      return this;
    }
    
    this.hash = this._hash();
    return this;
  }
  
  isFinalized() {
    return !!this.hash;
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this._transactionInputs.keys().join('')
    );
  }
}