import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionCollection {
  constructor() {
    this._transactions = new Map();
    this.hash = null;
  }
  
  add(transaction) {
    if (this.isFinalized()) {
      return this;
    }
    
    this._transactions.set(transaction.hash, transaction);
    return this;
  }
  
  fees() {
    return Array.from(this._transactions.entries()).reduce((total, output) => {
      total += output.fees();
    }, 0);
  }
  
  finalize() {
    if (this.isFinalized()) {
      return this;
    }
    
    this.hash = this._hash();
    return this;
  }
  
  size() {
    return this._transactions.size;
  }
  
  isFinalized() {
    return !!this.hash;
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      Array.from(this._transactions.keys()).join('')
    );
  }
}