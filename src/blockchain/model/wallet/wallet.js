import forge from 'node_modules/node-forge/dist/forge.min.js';
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection';
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection';
import Transaction from 'src/blockchain/model/transaction/transaction';

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
    if (!this._hash) {
      return "#NotAName";
    }
    
    return "#" + this._hash.digest().toHex().substring(0, 10);
  }
   
  sign(hash) {
    return this._privateKey.sign(hash);
  }
  
  _generateKeyPair() {
    var rsa = forge.pki.rsa;
    return rsa.generateKeyPair({bits: 512, e: 0x10001});
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this.publicKey
    );
  }
  
  transactionsChanged() {
   this._value = this._receivedTransactions.reduce((previousValue, transaction) => {
      previousValue += transaction.outputs.get(this.hash).amount;
    }, 0);
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
  
  newTransaction(inputAmount, outgoingTransactions) {
    if(inputAmount > this.amount) {
      throw new Error('Can not create transaction - not enough money');
    }
    
    const inputCollection = new TransactionInputCollection(this);
    while(inputCollection.value < inputAmount) {
      inputCollection.add(this._receivedTransactions.pop());
    }
    inputCollection.finalize();
    
    this.transactionsChanged();
    
    const outputCollection = new TransactionOutputCollection().add(this, inputCollection.value - inputAmount);
    outgoingTransactions.forEach(transaction => {
      outputCollection.add(transaction.receiver, transaction.value);
    });
    outputCollection.finalize();
    
    return new Transaction(this, inputCollection, outputCollection);
  }
}