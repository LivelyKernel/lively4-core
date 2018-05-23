import GenesisBlock from './genesisBlock.js';

export default class Blockchain {
  constructor(wallet) {
    this._blocks = new Map();
    this.headOfChain = new GenesisBlock(wallet);
    this._blocks.set(this._headOfChain.hash, this._headOfChain);
  }
  
  add(block) {
    if(!block.isVerified()) {
      // only accept valid blocks
      return;
    }
    if(block.previousHash != this._headOfChain.hash) {
      return;
    }
    this._blocks.set(block.hash, block);
    this._headOfChain = block;
  }
  
  getBlock(hash) {
    return this._blocks.get(hash);
  }
  
  size() {
    return this._blocks.size;
  }
}