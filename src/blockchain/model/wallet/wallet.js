import forge from 'node_modules/node-forge/dist/forge.min.js';
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js';
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js';
import Transaction from 'src/blockchain/model/transaction/transaction.js';

const TRANSACTION_FEES = 1.5;

export default class Wallet {
  constructor() {
    var rsaKeyPair = this._generateKeyPair();
    
    this.publicKey = rsaKeyPair.publicKey;
    this._privateKey = rsaKeyPair.privateKey;
    this.hash = this._hash(); 
    this._receivedTransactions = [];
    this._value = 0;
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.substring(0, 10);
  }
   
  sign(hash) {
    return this._privateKey.sign(hash);
  }
  
  _generateKeyPair() {
    var rsa = forge.pki.rsa;
    return rsa.generateKeyPair({bits: 512, e: 0x10001});
  }
  
  _hash() {
    const sha256Date = forge.md.sha256.create();
    const dateHash = sha256Date.update(Date.now());
    
    const sha256Wallet = forge.md.sha256.create();
    sha256Wallet.update(this.sign(dateHash));
    return sha256Wallet.digest().toHex();
  }
  
  transactionsChanged() {
   this.value = this._receivedTransactions.reduce((previousValue, transaction) => {
      return previousValue + transaction.outputs.get(this.hash).value;
    }, 0);
  }
  
  set value(value) {
    this._value = value;
  }
  
  get value() {
    return this._value;
  }
  
  receive(transaction) {
    if (!transaction.outputs.has(this.hash)) {
      return;
    }
    this._receivedTransactions.push(transaction);
    this.transactionsChanged();
  }
  
  newTransaction(receivers) {
    let inputAmount = receivers.reduce((sum, transaction) => { 
      return sum + transaction.value 
    }, 0);
    
    inputAmount += TRANSACTION_FEES;
    
    if (inputAmount > this.value) {
      throw new Error('Can not create transaction - not enough money');
    }
    
    if (inputAmount <= 0) {
      throw new Error('Can not send transaction with output value <= 0');
    }
    
    const inputCollection = new TransactionInputCollection(this);
    while(inputCollection.value < inputAmount) {
      inputCollection.add(this._receivedTransactions.pop());
    }
    inputCollection.finalize();
    
    this.transactionsChanged();
    
    const outputCollection = new TransactionOutputCollection().add(this, inputCollection.value - inputAmount);
    receivers.forEach(receiver => {
      outputCollection.add(receiver.receiver, receiver.value);
    });
    outputCollection.finalize();
    
    return new Transaction(this, inputCollection, outputCollection);
  }
}