import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionOutput {
  constructor(receiverWallet, value) {
    this.receiverHash = receiverWallet.hash;
    this.value = value;
    this.hash = this._hash();
  }
  
  get displayName() {
    if (!this._hash) {
      return "#NotAName";
    }
    
    return "#" + this._hash.digest().toHex().substring(0, 10);
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this.receiverHash + 
      this.value
    );
  }
}