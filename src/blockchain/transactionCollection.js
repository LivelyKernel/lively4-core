import crypto from "node_modules/crypto-js/crypto-js.js"

export default class TransactionCollection extends Map {
  calculateHash() {
    return crypto.SHA256(this.keys().join(''));
  }
  
  add(transaction) {
    this.set(transaction.hash, transaction);
  }
}