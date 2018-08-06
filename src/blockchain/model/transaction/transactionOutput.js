import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class TransactionOutput {
  constructor(receiverWallet, value) {
    this.receiverHash = receiverWallet.hash;
    this.value = value;
    this.hash = this._hash();
    this.transactionHash = "";
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.substring(0, 10);
  }
  
  get transactionDisplayName() {
    if (!this.transactionHash) {
      return "#NotAName";
    }
    
    return "#" + this.transactionHash.substring(0, 10);
  }
  
  get receiverDisplayName() {
    if (!this.receiverHash) {
      return "#NotAName";
    }
    
    return "#" + this.receiverHash.substring(0, 10);
  }
  
  _hash() {
    const sha256 = forge.md.sha256.create();
    sha256.update(
      Date.now() + 
      this.receiverHash + 
      this.value
    );
    return sha256.digest().toHex();
  }
}