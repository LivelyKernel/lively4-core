import crypto from "node_modules/crypto-js/crypto-js.js"

export default class Transaction {
  constructor(data, sender, receivers, inputTransactions) {
    this.timestamp = Date.now();
    this.data = data;
    this.sender = sender;
    this.reiver = receivers;
    this.inputTransactions = inputTransactions;
  }
}