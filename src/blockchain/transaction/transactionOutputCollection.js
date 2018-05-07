import forge from 'node_modules/node-forge/dist/forge.min.js';
import transactionOutput from './transactionOutput.js';

/**
  Intended usage:
  
  var outputs = new TransactionOutputCollection()
                    .add(receiver1, amount1)
                    .add(receiver2, amount2)
                    .add(receiver3, amount3)
                    .finalize();
**/

export default class TransactionOutputCollection {
  constructor() {
    this._transactionOutputs = new Map();
    this.hash = null;
  }
  
  add(receiverWallet, amount) {
    if (this.isFinalized()) {
      return this;
    }
    
    var output = new transactionOutput(receiverWallet, amount);
    this._transactionOutputs.set(receiverWallet.hash, output);
    return this;
  }
  
  value() {
    return this._transactionOutputs.entries().reduce(function(total, output) {
      total += output.amount;
    });
  }
  
  get(receiverHash) {
    return this._transactionOutputs.get(receiverHash);
  }
  
  finalize() {
    if (this.isFinalized()) {
      return this;
    }
    
    this.hash = this._hash();
    return this;
  }
  
  isFinalized() {
    return this.hash != null;
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this._transactionOutputs.keys().join('')
    );
  }
}