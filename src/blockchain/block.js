import crypto from "node_modules/crypto-js/crypto-js.js"

export default class Block {
  constructor(prevBlock, transactions) {
    this.transactions = transactions; 
    this.timestamp = Date.now();
    this.previousHash = prevBlock.hash;
  }
  
  calculateHash() {
    return crypto.SHA256(
      this.transactions.calculateHash() + 
      this.timestamp + 
      this.previousHash
    );
  }

}