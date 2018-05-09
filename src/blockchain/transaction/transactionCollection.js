import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionCollection {
  constructor() {
    this._transactions = new Map();
    this.hash = null;
  }
  
  add(transaction) {
    if (this.isFianlized()) {
      return this;
    }
    
    this._transactions.add(transaction.hash, transaction);
    return this;
  }
  
  fees() {
    return Array.from(this._transactions.entries()).reduce((total, output) => {
      total += output.fees();
    }, 0);
  }
  
  finalize() {
    if (this.isFinalize()) {
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
      this._transactions.keys().join('')
    );
  }
}