import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionOutput {
  constructor(receiverWallet, amount) {
    this.receiverHash = receiverWallet.hash;
    this.amount = amount;
    this.hash = this._hash();
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this.receiverHash + 
      this.amount
    );
  }
}