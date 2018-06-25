import MiningProof from '../block/miningProof.js';
import Block from '../block/block.js';
import TransactionCollection from '../transaction/transactionCollection.js';

const MINING_INTERVAL = 6; // in seconds

export default class Miner {
  constructor(blockchainNode) {
    this._blockchainNode = blockchainNode;
    this._transactions = new TransactionCollection();
  }
  
  addTransaction(transaction) {
    if(!transaction.isVerified()) {
      return;
    }
    this._transactions.add(transaction);
  }
  
  invalidateTransactions(block) {
    block.transactions.forEach(transaction => {
      this._transactions.remove(transaction);
    });
  }
  
  async mine() {
    if (this._blockchainNode.hasExited) {
      return;
    }
    
    const miningDifficulty = Math.log10(this._blockchainNode.blockchain.size());
    const miningProof = new MiningProof(miningDifficulty);
    await miningProof.work();
    const block = new Block(
      this._blockchainNode.wallet,
      this._transactions,
      miningProof,
      this._blockchainNode.blockchain.headOfChain.hash
    );
    this._transactions = new TransactionCollection();
    this._blockchainNode.propagateBlock(block);
    console.log('[BLOCKCHAIN] Successfully mined a new block');
  }
}