import GenesisBlock from './genesisBlock.js';

export default class Blockchain {
  constructor(wallet) {
    this._blocks = new Map();
    this.headOfChain = new GenesisBlock(wallet);
    this._blocks.set(this.headOfChain.hash, this.headOfChain);
  }
  
  size() {
    return this._blocks.size;
  }
  
  add(block) {
    if(!block.isVerified()) {
      // only accept valid blocks
      return;
    }
    if(block.previousHash != this.headOfChain.hash) {
      throw new Error('The block to be added does not reference the previous block correctly!')
    }
    this._blocks.set(block.hash, block);
    this.headOfChain = block;
  }
  
  getBlock(hash) {
    return this._blocks.get(hash);
  }
  
  isValid() {
    const blocks = Array.from(this._blocks).reverse();
    for(let i = 0; i < blocks.length; i++) {
      if (blocks[i][1].previousHash === "" && i === blocks.length - 1) {
         return true;
      }
      
      if(blocks[i][1].hash !== blocks[i][1]._hash().digest().toHex()) {
        return false;
      }
      
      if (this._blocks.get(blocks[i][1].previousHash).hash !== blocks[i][1].previousHash) {
        return false;
      }
    }
  }
  
  forEach(callback) {
    this._blocks.forEach((value) => callback(value));
  }

}