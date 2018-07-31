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
    
    return "#" + this.hash.substring(0, 10);
  }
  
  add(transaction) {
    if (this.isFinalized()) {
      return this;
    }
    
    this._transactions.set(transaction.hash, transaction);
    return this;
  }
  
  remove(transaction) {
    if (this.isFinalized()) {
      throw new Error("Cannot remove transaction from finalized transaction collection!");
    }
    
    if (!this._transactions.has(transaction.hash)) {
      return;
    }
    
    this._transactions.delete(transaction.hash);
  }
  
  get fees() {
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
    const sha256 = forge.md.sha256.create();
    sha256.update(
      Array.from(this._transactions.keys()).join('')
    );
    return sha256.digest().toHex();
  }
}