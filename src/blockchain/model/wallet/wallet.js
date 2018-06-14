import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class Wallet {
  constructor() {
    var rsaKeyPair = this._generateKeyPair();
    
    this.publicKey = rsaKeyPair.publicKey;
    this._privateKey = rsaKeyPair.privateKey;
    this.hash = this._hash(); 
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
  
  value() {
    // TODO: Implement function that returns value of all transactions that reference this wallet
    return 200;
  }
}