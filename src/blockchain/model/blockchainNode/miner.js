import MiningProof from '../block/miningProof.js';
import Block from '../block/block.js';

const MINING_INTERVALL = 60; // in seconds


export default class Miner {
  constructor(blockchainNode) {
    this._blockchainNode = blockchainNode;
    this._transactions = [];
    window.setInterval(() => {
      this.mine().bind(this);
    }, MINING_INTERVALL * 1000);
  }
  
  addTransaction(transaction) {
    if(!transaction.isVerified()) {
      return;
    }
    this._transactions.push(transaction);
  }
  
  mine() {
    const relevantTransactions = this._transactions.slice(0);
    this._transactions = [];
    const miningDifficulty = Math.log10(this._blockchainNode.blockchain.size());
    const miningProof = new MiningProof(miningDifficulty);
    const block = new Block(
      this._blockchainNode.wallet,
      relevantTransactions,
      miningProof,
      this._blockchainNode.blockchain.headOfChain.hash
    );
    this._blockchainNode.propagateBlock(block);
    console.log('[BLOCKCHAIN] Successfully mined a new block');
  }
}