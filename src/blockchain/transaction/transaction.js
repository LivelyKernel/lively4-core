import forge from 'node_modules/node-forge/dist/forge.min.js';

/**
  Intended usage:
  
  var transaction = new Transaction(sender, inputs, outputs)
                        .sign(sender);
**/

export default class Transaction {
  constructor(senderWallet, inputCollection, outputCollection) {
    this.senderHash = senderWallet.hash;
    this.senderPublicKey = senderWallet.publicKey;
    this.inputs = inputCollection;
    this.outputs = outputCollection;    
    this.hash = this._hash();
    this.signature = null;
  }
  
  sign(sender) {
    if (this.isSigned()) {
      return this;
    }
    
    if (this.fees() <= 0) {
      // transactions must pay fees
      return this;
    }
    
    // encrypt the hash using the given private key
    // this allows us to decrypt the signature later on using the matching public key
    this.signature = sender.sign(this.hash);
    return this;
  }
  
  isSigned() {
    return this.signature != null;
  }
  
  isOwner(senderPublicKey) {
    if (!this.isSigned()) {
      return false;
    }
    
    // recalculate hash for comparison
    // if anything was changed, this hash will not match the encrypted hash (signature)
    var hash = this._hash();
    
    // decrypt the signature using the given public key (==> hash) and compare with the hash we just calculated
    return senderPublicKey.verify(hash.digest().bytes(), this.signature);
  }
  
  inputValue() {
    return this.inputs.value();
  }
  
  outputValue() {
    return this.outputs.value();
  }
  
  fees() {
    return this.inputValue() - this.outputValue();
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      this.senderHash + 
      this.senderPublicKey + 
      this.inputs.hash + 
      this.outputs.hash
    );
  }
}