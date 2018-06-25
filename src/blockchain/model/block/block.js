import forge from 'node_modules/node-forge/dist/forge.min.js';
import Transaction from '../transaction/transaction.js';
import TransactionInputCollection from '../transaction/transactionInputCollection.js';
import TransactionOutputCollection from '../transaction/transactionOutputCollection.js';

const C_BLOCK_REWARD = 10;

export default class Block {
  constructor(minerWallet, transactions, miningProof, previousHash) {
    if (!miningProof.isFinalized()) {
      throw new Error("a block needs to be proven");
    }
    
    if (transactions.isFinalized()) {
      throw new Error("cannot append block reward transaction");
    }
    
    this.timestamp = Date.now();
    this.minerHash = minerWallet.hash;
    this.minerPublicKey = minerWallet.publicKey;
    this.transactions = transactions;
    this.miningProof = miningProof;
    this.reward = transactions.fees + C_BLOCK_REWARD;
    
    this._sendReward(minerWallet);
    
    this.previousHash = previousHash;
    this.hash = this._hash().digest().toHex();
    this.signature = this._generateSignature(minerWallet);
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.substring(0, 10);
  }
  
  isSigned() {
    return !!this.signature;
  }
  
  isVerified() {
    if (!this.isSigned()) {
      return false;
    }
    
    // recalculate hash for comparison
    // if anything was changed, this hash will not match the encrypted hash (signature)
    var hash = this._hash();
    
    // decrypt the signature using the public key (==> hash) and compare with the hash we just calculated
    return this.minerPublicKey.verify(hash.digest().bytes(), this.signature);
  }
  
  _sendReward(minerWallet) {
    var inputs = new TransactionInputCollection(minerWallet)
                      .addMiningReward(this)
                      .finalize();
    
    var outputs = new TransactionOutputCollection()
                      .add(minerWallet, this.reward)
                      .finalize();
    
    var transaction = new Transaction(minerWallet, inputs, outputs);
    
    // set input transaction to the transaction itself
    inputs.forEach((input) => input.transactionHash = transaction.hash);    
    
    this.transactions.add(transaction);
    this.transactions.finalize();
  }
  
  _generateSignature(minerWallet) {
    if (this.isSigned()) {
      return this;
    }
    
    if (!this.transactions.isFinalized()) {
      throw new Error("transactions need to be finallized");
    }
    
    if (!this.miningProof.isFinalized()) {
      throw new Error("a block needs to be proven");
    }
    
    // encrypt the hash using the given private key
    // this allows us to decrypt the signature later
    // on using the matching public key
    return minerWallet.sign(this._hash());
  }
  
  _hash() {
    const sha256 = forge.md.sha256.create();
    return sha256.update(
      this.timestamp +
      this.minetHash +
      this.minerPublicKey +
      this.transactions.hash +
      this.miningProof.hash + 
      this.previousHash +
      this.reward
    );
  }
}