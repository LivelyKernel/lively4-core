import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionCollection {
  constructor() {
    this._transactions = new Map();
    this.hash = null;
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.digest().toHex().substring(0, 10);
  }
  
  add(transaction) {
    if (this.isFinalized()) {
      return this;
    }
    
    this._transactions.set(transaction.hash, transaction);
    return this;
  }
  
  fees() {
    return Array.from(this._transactions.entries()).reduce((total, entry) => {
      return total + entry[1].fees;
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
  
  forEach(callback) {
    this._transactions.forEach((value) => callback(value));
  }
  
  getByHash(hash) {
    return this._transactions.get(hash);
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