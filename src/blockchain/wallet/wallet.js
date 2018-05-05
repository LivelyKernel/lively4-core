import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class Wallet {
  constructor() {
    var rsaKeyPair = this._generateKeyPair();
    
    this.publicKey = rsaKeyPair.publicKey;
    this._privateKey = rsaKeyPair.privateKey;
    this.hash = this._hash(); 
  }
  
  sign(hash) {
    return this._privateKey.sign(hash);
  }
  
  _generateKeyPair() {
    var rsa = forge.pki.rsa;
    return rsa.generateKeyPair({bits: 2048, e: 0x10001});
  }
  
  _hash() {
    var sha256 = forge.md.sh256.create();
    return sha256.update(
      this.rsaKeyPair.publicKey
    );
  }
}