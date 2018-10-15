import forge from 'node_modules/node-forge/dist/forge.min.js';
import TransactionOutput from './transactionOutput.js';

/**
  Intended usage:
  
  var inputs = new TransactionInputCollection(sender)
                    .add(transaction1)
                    .add(transaction2)
                    .add(transaction3)
                    .finalize();
**/

export default class TransactionInputCollection {
  constructor(senderWallet) {
    this._senderWallet = senderWallet;
    this._transactionInputs = new Map();
    this._containsMiningReward = false;
    this._value = 0;
    this.hash = null;
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.substring(0, 10);
  }
  
  add(transaction) {
    if (this.isFinalized()) {
      return this;
    }
    
    var output = transaction.outputs.get(this._senderWallet.hash);    
    if (output == null) {
      // the sender was not credited in the given transaction
      return this;
    }
    
    this._transactionInputs.set(output.hash, output);
    this._calculateValue();
    return this;
  }
  
  addMiningReward(block) {
    if (this.isFinalized()) {
      return this;
    }
    
    if (this._containsMiningReward) {
      // there must only be one mining reward per transaction
      return this;
    }

    if (block.minerHash !== this._senderWallet.hash) {
      throw new Error("the block must be mined by the reward receiver");
    }
    
    var output = new TransactionOutput(this._senderWallet, block.reward);
    this._transactionInputs.set(output.hash, output);
    this._containsMiningReward = true;
    this._calculateValue();
    return this;
  }
  
  get value() {
    return this._value;
  }
  
  finalize() {
    if (this.isFinalized()) {
      return this;
    }
    
    this.hash = this._hash();
    return this;
  }
  
  isFinalized() {
    return !!this.hash;
  }
  
  forEach(callback) {
    this._transactionInputs.forEach((value) => callback(value));
  }
  
  has(outputHash) {
    return this._transactionInputs.has(outputHash);
  }
  
  _calculateValue() {
    this._value = Array.from(this._transactionInputs.entries()).reduce((total, entry) => {
      return total + entry[1].value;
    }, 0);
  }
  
  _hash() {
    const sha256 = forge.md.sha256.create();
    sha256.update(
      Array.from(this._transactionInputs.keys()).join('')
    );
    return sha256.digest().toHex();
  }
}